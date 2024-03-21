import { describe, expect, it } from 'vitest';

import { asJSON } from './as-json.js';

describe('@acusti/parsing', () => {
    describe('asJSON', () => {
        it('should convert a LLM response string to a props object', () => {
            const response = `\
Here is the JSON output for the "About Us" page based on the provided props:
{
"heading": "Our Story",
"subheading": "A Passion for Sourdough"
}
`;
            expect(asJSON(response)).toEqual({
                heading: 'Our Story',
                subheading: 'A Passion for Sourdough',
            });
        });

        it('should handle nested JSON structures', () => {
            const response = `\
  Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!",
"props": {
"form": {
"email": "info@masamadre.com",
"message": "Please enter your message or inquiry below"
}
}
`;
            expect(asJSON(response)).toEqual({
                heading: 'Get in Touch',
                props: {
                    form: {
                        email: 'info@masamadre.com',
                        message: 'Please enter your message or inquiry below',
                    },
                },
                subheading: "We'd love to hear from you!",
            });
        });

        it('should handle JSON with missing comma-separators', () => {
            const response = `\
    Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!"
"props": {
"form": {
"name": "Contact Form",
"email": "info@masamadre.com",
"message": "Please enter your message or inquiry below"
"submit": "Submit"
}
}
`;
            expect(asJSON(response)).toEqual({
                heading: 'Get in Touch',
                props: {
                    form: {
                        email: 'info@masamadre.com',
                        message: 'Please enter your message or inquiry below',
                        name: 'Contact Form',
                        submit: 'Submit',
                    },
                },
                subheading: "We'd love to hear from you!",
            });
        });

        it('should handle JSON with trailing comma-separators', () => {
            const response = `\
  {
  "sectionTitle": "Meet the Team",
  "item1Content": "Tom Ryder - Owner & Wine Director",
  "item1AttributionLine1": "Learn more about Tom's passion for wine and his journey to opening Ryders",
  "item1AttributionLine2": "Read about Tom's experience in the wine industry and his approach to curating Ryders' wine list",
  "item2Content": "Sarah Johnson - Wine Educator",
  "item2AttributionLine1": "Discover Sarah's background in wine and her role in educating customers at Ryders",
  "item2AttributionLine2": "Learn about Sarah's favorite wine pairings and her recommendations for beginners",
  "item3Content": "Mike Smith - Cheese Specialist",
  "item3AttributionLine1": "Find out more about Mike's expertise in cheese and his role in curating Ryders' selection",
  "item3AttributionLine2": "Read about Mike's favorite cheese pairings and his recommendations for unique flavor combinations",
  }`;
            expect(asJSON(response)).toEqual({
                item1AttributionLine1:
                    "Learn more about Tom's passion for wine and his journey to opening Ryders",
                item1AttributionLine2:
                    "Read about Tom's experience in the wine industry and his approach to curating Ryders' wine list",
                item1Content: 'Tom Ryder - Owner & Wine Director',
                item2AttributionLine1:
                    "Discover Sarah's background in wine and her role in educating customers at Ryders",
                item2AttributionLine2:
                    "Learn about Sarah's favorite wine pairings and her recommendations for beginners",
                item2Content: 'Sarah Johnson - Wine Educator',
                item3AttributionLine1:
                    "Find out more about Mike's expertise in cheese and his role in curating Ryders' selection",
                item3AttributionLine2:
                    "Read about Mike's favorite cheese pairings and his recommendations for unique flavor combinations",
                item3Content: 'Mike Smith - Cheese Specialist',
                sectionTitle: 'Meet the Team',
            });
        });

        it('should strip invalid JSON when the LLM response goes off the rails', () => {
            const response = `\
Here is the JSON output for the "Meet the Team" page:
{
"callToAction": "Learn More",
"heading": "Meet the Team",
"subheading": "Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre."
[
"teamMembers": [
{
"name": "Jenny Lee",
"role": "Head Baker",
"description": "Jenny is the mastermind behind Masa Madre's delicious sourdough bread. With over 10 years of experience in the baking industry, she brings a wealth of knowledge and expertise to the table. Jenny's passion for sourdough bread is evident in every loaf she creates, and her dedication to using only the finest ingredients has earned her a loyal following of customers."
},
{
"name": "Tommy Thompson",
"role": "Baker",
"description": "Tommy is the muscle behind Masa Madre's bakery. With a background in culinary arts, he brings a creative touch to every loaf he bakes. Tommy's attention to detail and commitment to quality has made him an invaluable member of the team."
},
{
"name": "Emily Chen",
"role": "Marketing Manager",
"description": "Emily is the marketing genius behind Masa Madre's success. With a background in advertising and a passion for food, she has helped to create a strong brand identity for the bakery. Emily's creativity and attention to detail have been instrumental in building a loyal customer base."

]

}
`;
            expect(asJSON(response)).toEqual({
                callToAction: 'Learn More',
                heading: 'Meet the Team',
                subheading:
                    'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
            });
        });

        it('should handle too many closing curly braces', () => {
            const response = `\
{
"heading": "Notable Projects",
"subheading": "Explore some of our most successful and innovative designs",
"projects": [
{
"description": "Design for a new skyscraper in the city center, featuring a sleek and modern aesthetic. The building features a large atrium and floor-to-ceiling windows, providing an abundance of natural light and stunning views of the city skyline.",
"image": "https://pentagram.com/images/skyscraper.jpg",
"altText": "Skyscraper"
},
{
"description": "Redesign of a popular magazine, focusing on a clean and minimalist aesthetic, with a new layout and typography. The goal was to create a more modern and sophisticated look and feel.",
"image": "https://pentagram.com/images/magazine.jpg",
"altText": "Magazine"
},
{
"description": "Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.",
"image": "https://pentagram.com/images/non-profit.jpg",
"altText": "Non-Profit Organization"
}
]
}}`;
            const props = asJSON(response);
            expect(Object.keys(props!).length).toBe(3);
        });
    });
});
