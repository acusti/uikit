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
    });
});
