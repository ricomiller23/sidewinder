/**
 * VCF Utility (V2)
 * Generates and downloads a vCard file for an insider.
 */
export function exportToVcf(contact: any, companyName: string) {
  const vcard = generateVcardString(contact, companyName);
  downloadVcf(vcard, contact.name || 'contact');
}

export function bulkExportToVcf(contacts: any[]) {
  const vcards = contacts.map(c => {
    const name = c.contact_name || c.fullName || 'Insider';
    const title = c.role_title || c.officerTitle || 'Executive';
    const company = c.issuer_name || c.links?.[0]?.issuer?.name || 'Company';
    return generateVcardString(
      { name, title, email: c.email, phone: c.phone },
      company
    );
  }).join('\n');
  
  downloadVcf(vcards, 'insider_rolodex');
}

function generateVcardString(contact: any, companyName: string) {
  return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name || 'Insider'}
ORG:${companyName}
TITLE:${contact.title || 'Executive'}
EMAIL;TYPE=INTERNET:${contact.email || ''}
TEL;TYPE=WORK,VOICE:${contact.phone || ''}
END:VCARD`;
}

function downloadVcf(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
