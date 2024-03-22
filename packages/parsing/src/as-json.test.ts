/* eslint-disable sort-keys */
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
"description": "Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.",
"image": "https://pentagram.com/images/non-profit.jpg",
"altText": "Non-Profit Organization"

}

]

}}`;
            expect(asJSON(response)).toEqual({
                heading: 'Notable Projects',
                subheading:
                    'Explore some of our most successful and innovative designs',
                projects: [
                    {
                        description:
                            'Design for a new skyscraper in the city center, featuring a sleek and modern aesthetic. The building features a large atrium and floor-to-ceiling windows, providing an abundance of natural light and stunning views of the city skyline.',
                        image: 'https://pentagram.com/images/skyscraper.jpg',
                        altText: 'Skyscraper',
                    },
                    {
                        description:
                            'Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.',
                        image: 'https://pentagram.com/images/non-profit.jpg',
                        altText: 'Non-Profit Organization',
                    },
                ],
            });
        });

        it('should handle unterminated string values and invalid object nesting', () => {
            const response = `\
  Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, we offer a range of services to help you manage your wounds and promote healing. Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible.
Here are some of the services we offer:
{
"contentList1": [
{
"title": "Surgical Debridement",

"description": "Surgical debridement is a procedure that involves removing dead tissue from a wound to promote healing. Our experienced surgeons use the latest techniques and technologies to ensure the best possible outcomes.",
"content": "Surgical debridement"
}
]

"contentList2": [

{

"title": "Other Services",

"description": "In addition to our core services, we also offer a range of other services to help you manage your wounds and promote healing. These include wound assessment and monitoring, pain management, and education on wound care and prevention.",
"content": "Other services"
}
]

"contentList3": [

{

"title": "Our Team",

"description": "Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible. Meet our team of experts today.",
"content": "Our team"
}
]

}}`;
            expect(asJSON(response)).toEqual({
                bodyCopy: `\
At the Cleveland Clinic Wound Center in Vero Beach, Florida, we offer a range of services to help you manage your wounds and promote healing. Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible.
Here are some of the services we offer:
{
`,
                contentList1: [
                    {
                        content: 'Surgical debridement',
                        description:
                            'Surgical debridement is a procedure that involves removing dead tissue from a wound to promote healing. Our experienced surgeons use the latest techniques and technologies to ensure the best possible outcomes.',
                        title: 'Surgical Debridement',
                    },
                ],
                contentList2: [
                    {
                        content: 'Other services',
                        description:
                            'In addition to our core services, we also offer a range of other services to help you manage your wounds and promote healing. These include wound assessment and monitoring, pain management, and education on wound care and prevention.',
                        title: 'Other Services',
                    },
                ],
                contentList3: [
                    {
                        content: 'Our team',
                        description:
                            'Our team of experienced healthcare professionals is dedicated to providing high-quality, personalized care to help you recover and get back to your normal life as quickly as possible. Meet our team of experts today.',
                        title: 'Our Team',
                    },
                ],
            });
        });

        it('should handle partial (streaming) LLM reponses as they come in', () => {
            let response = `\
Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
Here are some of the services we offer:
{
"contentLi`;
            expect(asJSON(response)).toEqual({
                bodyCopy: `\
At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
Here are some of the services we offer:
{
`,
                contentLi: '',
            });

            response = `\
  Here is the JSON output for the "Meet the Team" page:
{
"callToAction": "Learn More",
"heading": "Meet the Team",
"subheading": "Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre."
[
"teamMembers": [
{
"`;
            expect(asJSON(response)).toEqual({
                callToAction: 'Learn More',
                heading: 'Meet the Team',
                subheading:
                    'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
            });

            response = `\
  Here are the props for the News Archive page based on the provided description and previous conversations:
Props:

"subheading1": "Explore Our News Archive",
"heading1": "News",
"subheading2":`;

            expect(asJSON(response)).toEqual({
                subheading1: 'Explore Our News Archive',
                heading1: 'News',
                subheading2: '',
            });
        });

        it('should detect and strip detailed pre- and post-amble text', () => {
            const response = `\
  Sure, here's an example JSON output for the "Types of Lessons" section based on the provided props:
{
"sectionSubtitle": "Dance Lessons for All Levels",
"sectionTitle": "Lessons Offered",
"itemSubtitle1": "Beginner",
"itemTitle1": "Introduction to Latin Dance",
"itemDescription1": "Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills.",
"itemSubtitle2": "Intermediate",
"itemTitle2": "Advanced Techniques",
"itemDescription2": "Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance.",
"link": "https://marteeeen.com/lessons/"
}

This output includes the following props:

* "sectionSubtitle": A subtitle for the section, which is "Dance Lessons for All Levels".
* "sectionTitle": The title of the section, which is "Lessons Offered".
* "itemSubtitle1", "itemTitle1", "itemDescription1": These props are used to define the first item in the list of lessons, which is beginner. The subtitle is "Beginner", the title is "Introduction to Latin Dance", and the description is "Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills."
* "itemSubtitle2", "itemTitle2", "itemDescription2": These props are used to define the second item in the list of lessons, which is intermediate. The subtitle is "Intermediate", the title is "Advanced Techniques", and the description is "Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance."
* "link": The link prop is used to define the URL of the lessons page, which is "https://marteeeen.com/lessons/".".`;

            expect(asJSON(response)).toEqual({
                sectionSubtitle: 'Dance Lessons for All Levels',
                sectionTitle: 'Lessons Offered',
                itemSubtitle1: 'Beginner',
                itemTitle1: 'Introduction to Latin Dance',
                itemDescription1:
                    'Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills.',
                itemSubtitle2: 'Intermediate',
                itemTitle2: 'Advanced Techniques',
                itemDescription2:
                    'Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance.',
                link: 'https://marteeeen.com/lessons/',
            });
        });

        it('should infer if content looks like an object and add missing curly braces if so', () => {
            const response = `\
  Here are the props for the "Blog" page:
Props:
"blogPostImage1": "/images/blog-post-image1.jpg",
"blogPostSubheading1": "Exploring the Art of Sourdough Baking",
"blogPostHeading1": "The Magic of Sourdough",
"blogPostLede1": "At Masa Madre, we're passionate about creating the perfect sourdough bread. Learn more about the art and craft of this ancient tradition.",
"blogPostImage2": "/images/blog-post-image2.jpg",
"blogPostSubheading2": "From Seed to Loaf",
"blogPostHeading2": "Our Journey to Your Table",
"blogPostLede2": "Discover the journey of our sourdough bread, from the seed to the loaf.",
"blogPostImage3": "/images/blog-post-image3.jpg",
"blogPostSubheading3": "Sourdough 101",
"blogPostHeading3": "Learn the Basics of Artisanal Bread Making",
"blogPostLede3": "Get started on your sourdough journey with our beginner's guide to artisanal bread making.",
`;
            expect(asJSON(response)).toEqual({
                blogPostImage1: '/images/blog-post-image1.jpg',
                blogPostSubheading1: 'Exploring the Art of Sourdough Baking',
                blogPostHeading1: 'The Magic of Sourdough',
                blogPostLede1:
                    "At Masa Madre, we're passionate about creating the perfect sourdough bread. Learn more about the art and craft of this ancient tradition.",
                blogPostImage2: '/images/blog-post-image2.jpg',
                blogPostSubheading2: 'From Seed to Loaf',
                blogPostHeading2: 'Our Journey to Your Table',
                blogPostLede2:
                    'Discover the journey of our sourdough bread, from the seed to the loaf.',
                blogPostImage3: '/images/blog-post-image3.jpg',
                blogPostSubheading3: 'Sourdough 101',
                blogPostHeading3: 'Learn the Basics of Artisanal Bread Making',
                blogPostLede3:
                    "Get started on your sourdough journey with our beginner's guide to artisanal bread making.",
            });
        });

        it('handles partial responses without getting stuck', () => {
            const response =
                '  Here is a sample JSON output for the "Branding Portfolio"';
            expect(asJSON(response)).toEqual('');
        });
    });
});
