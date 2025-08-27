/**
 * Approval System Database Optimizations
 * - Add status transition constraints
 * - Add performance indexes for approval queries
 * - Add listing type validation constraints
 */

exports.up = function(knex) {
  return knex.schema
    .raw(`
      -- Drop old status constraint and add new one with rejected status
      ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
    `)
    .raw(`
      -- Add status transition constraint with rejected support
      ALTER TABLE properties 
      ADD CONSTRAINT properties_status_valid 
      CHECK (status IN ('pending', 'active', 'sold', 'archived', 'rejected'));
    `)
    .raw(`
      -- Add listing type validation constraint
      ALTER TABLE properties 
      ADD CONSTRAINT properties_listing_type_valid 
      CHECK (listing_type IN ('agency_owned', 'branch_owned', 'brokerage'));
    `)
    .raw(`
      -- Add listing type specific validation constraints
      ALTER TABLE properties 
      ADD CONSTRAINT properties_brokerage_fields_check
      CHECK (
        (listing_type = 'brokerage' AND 
         owner_first_name IS NOT NULL AND 
         owner_last_name IS NOT NULL AND
         owner_contact IS NOT NULL AND
         brokerage_commission_percent IS NOT NULL) OR
        (listing_type IN ('agency_owned', 'branch_owned') AND
         buy_price_azn IS NOT NULL)
      );
    `)
    .raw(`
      -- Create index for pending approvals queries
      CREATE INDEX IF NOT EXISTS idx_properties_pending_approvals 
      ON properties(status, listing_type, created_at) 
      WHERE status = 'pending';
    `)
    .raw(`
      -- Create index for approval history queries
      CREATE INDEX IF NOT EXISTS idx_properties_approval_lookup
      ON properties(id, status, listing_type, created_by_id);
    `)
    .raw(`
      -- Create index for audit logs performance
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup
      ON audit_logs(entity, entity_id, created_at DESC);
    `)
    .raw(`
      -- Create index for audit logs actor lookup
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_lookup
      ON audit_logs(actor_id, action, created_at DESC);
    `);
};

exports.down = function(knex) {
  return knex.schema
    .raw(`DROP INDEX IF EXISTS idx_audit_logs_actor_lookup;`)
    .raw(`DROP INDEX IF EXISTS idx_audit_logs_entity_lookup;`)
    .raw(`DROP INDEX IF EXISTS idx_properties_approval_lookup;`)
    .raw(`DROP INDEX IF EXISTS idx_properties_pending_approvals;`)
    .raw(`ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_brokerage_fields_check;`)
    .raw(`ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_valid;`)
    .raw(`ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_valid;`);
};