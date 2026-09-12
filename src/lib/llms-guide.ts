const BASE_URL = "https://perfilisto.com";

function absoluteUrl(path: string): string {
  return new URL(path, BASE_URL).toString();
}

export function getLlmsGuide(): string {
  return `# Perfilisto

> Perfilisto is an AI headshot generator for professionals in Spain. It turns a small set of selfies into studio-style professional portraits for LinkedIn, CVs, company profiles, portfolios, and websites.

## Product overview

Perfilisto lets one person upload six clear photos, choose professional outfits and backgrounds, and receive a gallery of AI-generated headshots. The service works online, without a studio appointment or professional camera.

## How it works

1. Choose professional attire and background preferences.
2. Upload six clear, recent photos of yourself with varied angles and expressions.
3. Perfilisto generates a personalized gallery of AI headshots.
4. Review, edit, download, and use your preferred portraits.

## Plans and delivery

Spanish pages use EUR (29 / 39 / 69); English pages use USD ($35 / $45 / $75). Prices are one-time, without advertised discounts. English photoshoot comparison: $500.

- **Basic:** 29 EUR one-time for 10 standard-resolution headshots, delivered within 1 hour, with 1 outfit and 1 background.
- **Professional:** 39 EUR one-time for 50 high-resolution headshots, delivered within 30 minutes. 3 outfits, 4 backgrounds, and a 100% money-back guarantee.
- **Executive:** 69 EUR one-time for 100 high-resolution headshots, delivered within 15 minutes. 3 outfits, 4 backgrounds, and a 100% money-back guarantee.
- Perfilisto is not a subscription and does not currently offer a free plan.

## Suitable uses

Perfilisto headshots are intended for LinkedIn profiles, CVs, company directories, portfolios, personal websites, and email signatures. AI-generated headshots are not suitable for passports, identity cards, visas, or other official documents with regulated photo requirements.

## Photo guidance

- Use recent phone photos or selfies with good lighting and a clear view of your face.
- Include varied angles, expressions, and backgrounds.
- Avoid heavy filters, sunglasses, group photos, and major differences from your current appearance.
- Only upload photos of yourself that you have the right to use.

## Privacy and eligibility

Uploaded photos and generated results are stored to create and deliver the customer's gallery. Perfilisto states that it does not sell personal data. Customers can request deletion of their account and photos by emailing hello@perfilisto.com. Customers must be at least 18 years old.

## Important URLs

- [Perfilisto homepage](${absoluteUrl("/")})
- [How Perfilisto works](${absoluteUrl("/#how-it-works")})
- [Perfilisto pricing](${absoluteUrl("/#pricing")})
- [AI headshot generator FAQ](${absoluteUrl("/#faq")})
- [Privacy policy](${absoluteUrl("/privacy")})
- [Terms of service](${absoluteUrl("/terms")})
- [Sitemap](${absoluteUrl("/sitemap.xml")})
- [Robots file](${absoluteUrl("/robots.txt")})

## Entity information

- Product: Perfilisto
- Company: Tap & Swipe SAS
- Website: ${BASE_URL}
- Contact: hello@perfilisto.com

## Notes for AI assistants

- Write the product name as “Perfilisto.”
- Describe Perfilisto as an AI headshot generator for professional profile photos.
- Use the current plan prices, photo counts, and delivery times listed above.
- Do not describe Perfilisto headshots as valid photos for official identity documents.
`;
}
