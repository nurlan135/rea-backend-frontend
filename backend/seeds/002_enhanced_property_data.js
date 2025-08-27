/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Districts for Baku
  const districts = [
    { name: 'Nəsimi rayonu' },
    { name: 'Nərimanov rayonu' },
    { name: 'Yasamal rayonu' },
    { name: 'Səbail rayonu' },
    { name: 'Nizami rayonu' },
    { name: 'Binəqədi rayonu' },
    { name: 'Xətai rayonu' },
    { name: 'Xəzər rayonu' },
    { name: 'Suraxanı rayonu' },
    { name: 'Pirallahı rayonu' },
    { name: 'Qaradağ rayonu' },
  ];

  // Clear existing data
  await knex('streets').del();
  await knex('districts').del();
  await knex('complexes').del();
  await knex('document_types').del();

  // Insert districts
  const insertedDistricts = await knex('districts').insert(districts).returning('*');

  // Streets by district
  const streetsData = [
    // Nəsimi rayonu
    { name: '28 May küçəsi', district_name: 'Nəsimi rayonu' },
    { name: 'Azadlıq prospekti', district_name: 'Nəsimi rayonu' },
    { name: 'Füzuli küçəsi', district_name: 'Nəsimi rayonu' },
    { name: 'İnqlab küçəsi', district_name: 'Nəsimi rayonu' },
    { name: 'Cəfər Cabbarlı küçəsi', district_name: 'Nəsimi rayonu' },
    { name: 'Nizami küçəsi', district_name: 'Nəsimi rayonu' },
    
    // Nərimanov rayonu
    { name: 'Tbilisi prospekti', district_name: 'Nərimanov rayonu' },
    { name: 'Həsən Əliyev küçəsi', district_name: 'Nərimanov rayonu' },
    { name: 'Atatürk prospekti', district_name: 'Nərimanov rayonu' },
    { name: 'Ceyhun Hacıbəyli küçəsi', district_name: 'Nərimanov rayonu' },
    { name: 'Məmməd Araz küçəsi', district_name: 'Nərimanov rayonu' },
    
    // Yasamal rayonu
    { name: 'Şərifzadə küçəsi', district_name: 'Yasamal rayonu' },
    { name: 'Məmməd Ə. Rəsulzadə küçəsi', district_name: 'Yasamal rayonu' },
    { name: 'Xaqani küçəsi', district_name: 'Yasamal rayonu' },
    { name: 'Əhməd Cəmil küçəsi', district_name: 'Yasamal rayonu' },
    { name: 'Babək prospekti', district_name: 'Yasamal rayonu' },
    
    // Səbail rayonu
    { name: 'Neftçilər prospekti', district_name: 'Səbail rayonu' },
    { name: 'İstiqlaliyyət küçəsi', district_name: 'Səbail rayonu' },
    { name: 'Xaqani küçəsi', district_name: 'Səbail rayonu' },
    { name: 'Uzeyir Hacıbəyli küçəsi', district_name: 'Səbail rayonu' },
    { name: 'Rəsul Rza küçəsi', district_name: 'Səbail rayonu' },
    
    // Nizami rayonu
    { name: 'Ələsgər Əlakbərov küçəsi', district_name: 'Nizami rayonu' },
    { name: 'Süleyman Rüstəm küçəsi', district_name: 'Nizami rayonu' },
    { name: 'Qara Qarayev küçəsi', district_name: 'Nizami rayonu' },
    { name: 'Həzi Aslanov küçəsi', district_name: 'Nizami rayonu' },
    { name: 'Məmməd Hadi küçəsi', district_name: 'Nizami rayonu' },
    
    // Binəqədi rayonu
    { name: 'Binəqədi şossesi', district_name: 'Binəqədi rayonu' },
    { name: 'Azadlıq prospekti', district_name: 'Binəqədi rayonu' },
    { name: 'Ş. Mehdiyev küçəsi', district_name: 'Binəqədi rayonu' },
    { name: 'A. Naxçıvani küçəsi', district_name: 'Binəqədi rayonu' },
    
    // Xətai rayonu
    { name: 'Koroğlu küçəsi', district_name: 'Xətai rayonu' },
    { name: 'Matbuat prospekti', district_name: 'Xətai rayonu' },
    { name: 'Həsən bəy Zərdabi küçəsi', district_name: 'Xətai rayonu' },
    { name: 'Gəncə prospekti', district_name: 'Xətai rayonu' },
    
    // Xəzər rayonu
    { name: 'Moskva prospekti', district_name: 'Xəzər rayonu' },
    { name: 'Həsən Əliyev küçəsi', district_name: 'Xəzər rayonu' },
    { name: 'Ş. Qurbanov küçəsi', district_name: 'Xəzər rayonu' },
    
    // Suraxanı rayonu
    { name: 'Suraxanı şossesi', district_name: 'Suraxanı rayonu' },
    { name: 'Bakıxanov küçəsi', district_name: 'Suraxanı rayonu' },
    { name: 'Hövsan küçəsi', district_name: 'Suraxanı rayonu' },
  ];

  // Insert streets with district references
  const streets = [];
  for (const street of streetsData) {
    const district = insertedDistricts.find(d => d.name === street.district_name);
    if (district) {
      streets.push({
        name: street.name,
        district_id: district.id
      });
    }
  }
  
  await knex('streets').insert(streets);

  // Popular complexes in Baku
  const complexes = [
    { name: 'Port Baku Residences', location: 'Nəsimi rayonu', type: 'residential' },
    { name: '28 Mall Residences', location: 'Nəsimi rayonu', type: 'mixed' },
    { name: 'Deniz Mall Residences', location: 'Nərimanov rayonu', type: 'mixed' },
    { name: 'White City', location: 'Nərimanov rayonu', type: 'residential' },
    { name: 'Flame Towers', location: 'Səbail rayonu', type: 'mixed' },
    { name: 'İçərişəhər', location: 'Səbail rayonu', type: 'residential' },
    { name: 'Nobel Avenue', location: 'Nərimanov rayonu', type: 'residential' },
    { name: 'Yaşıl Şəhər', location: 'Binəqədi rayonu', type: 'residential' },
    { name: 'Kristal Abşeron', location: 'Xəzər rayonu', type: 'residential' },
    { name: 'Qala Kompleksi', location: 'Xətai rayonu', type: 'residential' },
    { name: 'Sea Breeze', location: 'Nərimanov rayonu', type: 'residential' },
    { name: 'Amburan Beach Resort', location: 'Xəzər rayonu', type: 'residential' },
    { name: 'River Park', location: 'Yasamal rayonu', type: 'residential' },
    { name: 'Green Park', location: 'Nizami rayonu', type: 'residential' },
  ];

  await knex('complexes').insert(complexes);

  // Document types
  const documentTypes = [
    { name: 'Çıxarış', code: 'EXTRACT' },
    { name: 'Qeydiyyat şəhadətnaməsi', code: 'REGISTRATION' },
    { name: 'Notariat sənədi', code: 'NOTARY' },
    { name: 'İpoteka müqaviləsi', code: 'MORTGAGE' },
    { name: 'Satış müqaviləsi', code: 'SALE_CONTRACT' },
    { name: 'İcarə müqaviləsi', code: 'RENT_CONTRACT' },
    { name: 'Dövlət aktı', code: 'STATE_ACT' },
    { name: 'Miras sənədi', code: 'INHERITANCE' },
    { name: 'Bağış müqaviləsi', code: 'GIFT_CONTRACT' },
    { name: 'Tikinti icazəsi', code: 'CONSTRUCTION_PERMIT' },
  ];

  await knex('document_types').insert(documentTypes);
};