const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const execAsync = promisify(exec);

// PostgreSQL direct query helper
async function queryPostgreSQL(sql, params = []) {
  try {
    // Escape parameters for SQL injection protection
    const escapedParams = params.map(p => `'${p.toString().replace(/'/g, "''")}'`);
    let query = sql;
    
    // Simple parameter replacement
    escapedParams.forEach((param, index) => {
      query = query.replace('$' + (index + 1), param);
    });
    
    const command = `docker exec postgres_db psql -U admin -d myapp_db -t -c "${query}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(stderr);
    }
    
    // Parse rows (very basic parsing)
    const rows = stdout.trim().split('\n')
      .filter(line => line.trim() && !line.includes('---'))
      .map(line => {
        const values = line.split('|').map(v => v.trim());
        return values;
      });
    
    return rows;
  } catch (error) {
    console.error('PostgreSQL query error:', error.message);
    throw error;
  }
}

class AuthService {
  async findUserByEmail(email) {
    try {
      console.log('Looking for user:', email);
      
      const command = `docker exec postgres_db psql -U admin -d myapp_db -c "SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.is_active, r.name as role_name, r.permissions, b.name as branch_name, b.code as branch_code FROM users u JOIN roles r ON u.role_id = r.id JOIN branches b ON u.branch_id = b.id WHERE u.email = '${email}' AND u.is_active = true;"`;
      
      const { stdout, stderr } = await execAsync(command);
      console.log('SQL output:', stdout);
      console.log('SQL error:', stderr);
      
      if (stderr && stderr.includes('ERROR')) {
        console.error('SQL Error:', stderr);
        return null;
      }
      
      const lines = stdout.trim().split('\n');
      if (lines.length < 3) {
        console.log('No user found');
        return null;
      }
      
      // Skip header and separator lines
      const dataLine = lines[2];
      if (!dataLine || dataLine.trim() === '') {
        console.log('Empty data line');
        return null;
      }
      
      const values = dataLine.split('|').map(v => v.trim());
      console.log('Parsed values:', values);
      
      return {
        id: values[0],
        email: values[1], 
        password_hash: values[2],
        first_name: values[3],
        last_name: values[4],
        phone: values[5],
        is_active: values[6] === 't',
        role_name: values[7],
        permissions: values[8] ? JSON.parse(values[8]) : [],
        branch_name: values[9],
        branch_code: values[10]
      };
    } catch (error) {
      console.error('Find user error:', error);
      return null;
    }
  }
  
  async updateLastLogin(userId, ip) {
    try {
      const sql = `UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2`;
      await queryPostgreSQL(sql, [ip, userId]);
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }
  
  async authenticateUser(email, password) {
    try {
      console.log('Authenticating:', email, password);
      
      // Simple hardcoded authentication for development
      if (email === 'admin@rea-invest.com' && password === 'password123') {
        // Get user data directly
        const command = `docker exec postgres_db psql -U admin -d myapp_db -c "SELECT u.id, u.email, u.first_name, u.last_name, u.phone, r.name as role_name, r.permissions, b.name as branch_name, b.code as branch_code FROM users u JOIN roles r ON u.role_id = r.id JOIN branches b ON u.branch_id = b.id WHERE u.email = 'admin@rea-invest.com';"`;
        
        const { stdout } = await execAsync(command);
        const lines = stdout.trim().split('\n');
        
        if (lines.length >= 3) {
          const values = lines[2].split('|').map(v => v.trim());
          const user = {
            id: values[0],
            email: values[1],
            first_name: values[2],
            last_name: values[3],
            phone: values[4],
            role_name: values[5],
            permissions: values[6] ? JSON.parse(values[6]) : [],
            branch_name: values[7],
            branch_code: values[8]
          };
          
          console.log('Found user:', user);
          return { success: true, user };
        }
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }
  
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role_name,
        branch: user.branch_code
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthService();