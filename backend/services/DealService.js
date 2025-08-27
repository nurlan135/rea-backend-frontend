const knex = require('../database');

class DealService {
  /**
   * Calculate brokerage commission amount
   * @param {number} salePrice - Sale price in AZN
   * @param {number} commissionPercent - Commission percentage 
   * @returns {number} Commission amount in AZN
   */
  static calculateBrokerageCommission(salePrice, commissionPercent) {
    if (!salePrice || !commissionPercent || salePrice <= 0 || commissionPercent <= 0) {
      return 0;
    }
    
    return (salePrice * commissionPercent) / 100;
  }

  /**
   * Calculate branch sales commission (2.5% REA INVEST, 2.5% Branch)
   * @param {number} profit - Net profit amount
   * @returns {object} Commission breakdown
   */
  static calculateBranchCommission(profit) {
    if (!profit || profit <= 0) {
      return {
        rea_invest_commission: 0,
        branch_commission: 0,
        total_commission: 0
      };
    }
    
    const reaCommission = (profit * 2.5) / 100;
    const branchCommission = (profit * 2.5) / 100;
    
    return {
      rea_invest_commission: reaCommission,
      branch_commission: branchCommission,
      total_commission: reaCommission + branchCommission
    };
  }

  /**
   * Create or update deal with commission calculations
   * @param {object} dealData - Deal information
   * @param {object} trx - Database transaction
   * @returns {object} Created/updated deal with calculated commissions
   */
  static async createDeal(dealData, trx = knex) {
    const {
      property_id,
      customer_id,
      type,
      sell_price_azn,
      buy_price_azn,
      deal_type = 'direct',
      ...otherData
    } = dealData;

    // Get property information for commission calculations
    const property = await trx('properties')
      .where('id', property_id)
      .first();

    if (!property) {
      throw new Error('Property not found');
    }

    let calculatedData = { ...otherData };

    // Calculate commission based on deal type
    if (deal_type === 'brokerage' && property.brokerage_commission_percent && sell_price_azn) {
      calculatedData.brokerage_percent = property.brokerage_commission_percent;
      calculatedData.brokerage_amount = this.calculateBrokerageCommission(
        sell_price_azn,
        property.brokerage_commission_percent
      );
    }

    // For branch sales, calculate net profit and commissions
    if (property.listing_type === 'branch_owned' && sell_price_azn && buy_price_azn) {
      // Get total expenses for this property
      const expenses = await trx('expenses')
        .where('property_id', property_id)
        .sum('amount_azn as total_expenses')
        .first();

      const totalExpenses = parseFloat(expenses?.total_expenses || 0);
      const profit = sell_price_azn - buy_price_azn - totalExpenses;
      
      if (profit > 0) {
        const commissionBreakdown = this.calculateBranchCommission(profit);
        calculatedData.profit_azn = profit;
        calculatedData.rea_commission_azn = commissionBreakdown.rea_invest_commission;
        calculatedData.branch_commission_azn = commissionBreakdown.branch_commission;
      }
    }

    // Create the deal
    const [dealId] = await trx('deals').insert({
      property_id,
      customer_id,
      type,
      sell_price_azn,
      buy_price_azn,
      deal_type,
      ...calculatedData,
      closed_at: new Date()
    }).returning('id');

    // Get the created deal with all calculated fields
    const createdDeal = await trx('deals').where('id', dealId).first();

    return createdDeal;
  }

  /**
   * Update deal and recalculate commissions
   * @param {string} dealId - Deal ID to update
   * @param {object} updateData - Data to update
   * @param {object} trx - Database transaction
   * @returns {object} Updated deal
   */
  static async updateDeal(dealId, updateData, trx = knex) {
    const existingDeal = await trx('deals').where('id', dealId).first();
    
    if (!existingDeal) {
      throw new Error('Deal not found');
    }

    // If sale price or commission percent changed, recalculate
    const needsRecalculation = updateData.sell_price_azn || updateData.brokerage_percent;
    
    let calculatedData = { ...updateData };

    if (needsRecalculation && existingDeal.deal_type === 'brokerage') {
      const salePrice = updateData.sell_price_azn || existingDeal.sell_price_azn;
      const commissionPercent = updateData.brokerage_percent || existingDeal.brokerage_percent;
      
      if (salePrice && commissionPercent) {
        calculatedData.brokerage_amount = this.calculateBrokerageCommission(
          salePrice,
          commissionPercent
        );
      }
    }

    // Update the deal
    await trx('deals').where('id', dealId).update(calculatedData);

    // Return updated deal
    const updatedDeal = await trx('deals').where('id', dealId).first();
    
    return updatedDeal;
  }

  /**
   * Get commission summary for reporting
   * @param {object} filters - Date range and other filters
   * @returns {object} Commission summary data
   */
  static async getCommissionSummary(filters = {}) {
    const { from_date, to_date, deal_type, listing_type } = filters;
    
    let query = knex('deals as d')
      .leftJoin('properties as p', 'd.property_id', 'p.id')
      .select(
        knex.raw('COUNT(*) as total_deals'),
        knex.raw('SUM(d.sell_price_azn) as total_sales'),
        knex.raw('SUM(d.brokerage_amount) as total_brokerage_commission'),
        knex.raw('SUM(d.rea_commission_azn) as total_rea_commission'),
        knex.raw('SUM(d.branch_commission_azn) as total_branch_commission')
      )
      .where('d.closed_at', 'is not', null);

    if (from_date) {
      query = query.where('d.closed_at', '>=', from_date);
    }
    
    if (to_date) {
      query = query.where('d.closed_at', '<=', to_date);
    }
    
    if (deal_type) {
      query = query.where('d.deal_type', deal_type);
    }
    
    if (listing_type) {
      query = query.where('p.listing_type', listing_type);
    }

    const summary = await query.first();
    
    return {
      total_deals: parseInt(summary.total_deals) || 0,
      total_sales: parseFloat(summary.total_sales) || 0,
      total_brokerage_commission: parseFloat(summary.total_brokerage_commission) || 0,
      total_rea_commission: parseFloat(summary.total_rea_commission) || 0,
      total_branch_commission: parseFloat(summary.total_branch_commission) || 0,
      total_commission: (parseFloat(summary.total_brokerage_commission) || 0) + 
                       (parseFloat(summary.total_rea_commission) || 0) + 
                       (parseFloat(summary.total_branch_commission) || 0)
    };
  }
}

module.exports = DealService;