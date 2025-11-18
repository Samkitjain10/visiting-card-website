import vCardsJS from 'vcards-js';

interface Contact {
  name?: string;
  company?: string;
  phones?: string[];
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

export function createVCF(contacts: Contact[]): string {
  const all = contacts.map((c) => {
    const vCard = vCardsJS();
    vCard.firstName = c.name || 'Unknown';
    vCard.organization = c.company || '';
    
    // Handle multiple phone numbers
    const phones = Array.isArray(c.phones) ? c.phones : (c.phone ? [c.phone] : []);
    if (phones.length > 0) {
      vCard.cellPhone = phones[0];
      if (phones.length > 1) {
        vCard.workPhone = phones[1];
      }
      if (phones.length > 2) {
        vCard.homePhone = phones[2];
      }
    }
    
    vCard.email = c.email || '';
    
    // Handle address
    if (c.address && c.address.trim()) {
      try {
        const addressStr = c.address.trim();
        
        // Check if address has newlines (multi-line format)
        const hasNewlines = addressStr.includes('\n');
        
        let street = '';
        let city = '';
        let stateProvince = '';
        let postalCode = '';
        let country = '';
        
        if (hasNewlines) {
          // Multi-line address: split by newlines
          const addressLines = addressStr.split('\n').map(line => line.trim()).filter(line => line);
          street = addressLines[0] || '';
          city = addressLines[1] || '';
          stateProvince = addressLines[2] || '';
          postalCode = addressLines[3] || '';
          country = addressLines[4] || '';
        } else {
          // Single-line address: try to parse by commas intelligently
          const parts = addressStr.split(',').map(part => part.trim()).filter(part => part);
          
          if (parts.length > 0) {
            // Try to identify postal code (usually 5-6 digits, may have dash)
            const postalCodeRegex = /\b\d{5,6}(?:-\d{4})?\b/;
            
            // First, extract postal code from any part
            for (let i = 0; i < parts.length; i++) {
              if (postalCodeRegex.test(parts[i])) {
                const match = parts[i].match(postalCodeRegex);
                if (match) {
                  postalCode = match[0];
                  // Remove postal code from the part (handle "City - 311001" format)
                  parts[i] = parts[i].replace(postalCodeRegex, '').replace(/^\s*-\s*|\s*-\s*$/g, '').trim();
                }
                break;
              }
            }
            
            // Last part is usually state/country
            if (parts.length > 0) {
              const lastPart = parts[parts.length - 1];
              // If it looks like a state/country (no numbers, short, typically 2-30 chars)
              if (!/\d/.test(lastPart) && lastPart.length >= 2 && lastPart.length < 30) {
                stateProvince = lastPart;
                parts.pop();
              }
            }
            
            // Second to last part (before state) is usually city
            if (parts.length > 0) {
              const cityPart = parts[parts.length - 1];
              // If it doesn't look like a street address (short, no numbers, or has "Nagar", "Road", etc.)
              if (cityPart.length < 50 && (!/\d{3,}/.test(cityPart) || /nagar|road|street|avenue|lane/i.test(cityPart))) {
                city = cityPart;
                parts.pop();
              }
            }
            
            // Everything else is street address
            street = parts.join(', ') || addressStr; // Fallback to full address if no parts remain
          } else {
            // No commas, use entire string as street
            street = addressStr;
          }
        }
        
        // For business contacts, use workAddress only (set properties individually)
        // Initialize workAddress if it doesn't exist
        if (!vCard.workAddress) {
          vCard.workAddress = {};
        }
        
        // Clean the address components - remove any special characters that might cause issues
        // Replace semicolons and backslashes with spaces, then normalize whitespace
        const cleanStreet = street.replace(/[;\\]/g, ' ').replace(/\s+/g, ' ').trim();
        const cleanCity = city.replace(/[;\\]/g, ' ').replace(/\s+/g, ' ').trim();
        const cleanState = stateProvince.replace(/[;\\]/g, ' ').replace(/\s+/g, ' ').trim();
        const cleanPostal = postalCode.replace(/[;\\]/g, '').trim();
        const cleanCountry = country.replace(/[;\\]/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Build a clean full address string for better compatibility
        const addressParts = [];
        if (cleanStreet) addressParts.push(cleanStreet);
        if (cleanCity) addressParts.push(cleanCity);
        if (cleanState) addressParts.push(cleanState);
        if (cleanPostal) addressParts.push(cleanPostal);
        if (cleanCountry) addressParts.push(cleanCountry);
        
        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : addressStr.replace(/[;\\]/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Set address properties - put full address in street for better compatibility
        // Some vCard readers display better when address is in street field
        vCard.workAddress.street = fullAddress;
        // Also set individual fields for proper vCard structure
        if (cleanCity) vCard.workAddress.city = cleanCity;
        if (cleanState) vCard.workAddress.stateProvince = cleanState;
        if (cleanPostal) vCard.workAddress.postalCode = cleanPostal;
        if (cleanCountry) vCard.workAddress.country = cleanCountry;
      } catch (error) {
        // If address setting fails, add it to the note as fallback
        console.warn('Failed to set address in vCard:', error);
        const existingNote = c.note || '';
        vCard.note = existingNote ? `${existingNote}\n\nAddress: ${c.address}` : `Address: ${c.address}`;
      }
    }
    
    vCard.note = c.note || '';
    return vCard.getFormattedString();
  });
  
  return all.join('\n');
}

