/* eslint-disable sort-keys */
import { describe, expect, it } from 'vitest';

import { parseAsJSON } from './parse-as-json.js';

describe('@acusti/parsing', () => {
    describe('parseAsJSON', () => {
        it('converts a LLM response string to a JSON object', convertToJSONTestCase);
        it('handles nested JSON structures', () => nestedJSONTestCase);
        it('handles JSON with missing comma-separators', missingCommasTestCase);
        it('handles JSON with trailing comma-separators', trailingCommasTestCase);
        it(
            'strips invalid JSON when the LLM response goes off the rails',
            stripInvalidJSONTestCase,
        );
        it('handles too many closing curly braces', extraClosingCurliesTestCase);
        it(
            'handles unterminated string values and invalid object nesting',
            unterminatedStringsAndInvalidNestingTestCase,
        );
        it(
            'handles partial (streaming) LLM responses as they come in',
            partialResponsesTestCase,
        );
        it('detects and strip detailed pre- and post-amble text', preambleTestCase);
        it(
            'infers if content looks like an object and add missing curly braces if so',
            missingCurliesTestCase,
        );
        it(
            'detects responses where the response restarts halfway through',
            restartsMidResponseTestCase,
        );
        it(
            'parses a markdown table of two columns into key/value pairs',
            markdownTableTestCase,
        );
        it('preserves escaped new lines within strings', preservesNewLinesTestCase);
        it('handles extraneous escape characters', extraneousEscapeCharactersTestCase);
        it('handles unescaped double quotes', unescapedDoubleQuotesTestCase);
        it(
            'detects premature closing curly brace and ignores it',
            prematureClosingCurliesTestCase,
        );
        it(
            'detects an object key with a missing value and fills it in',
            missingValuesTestCase,
        );
    });
});

function convertToJSONTestCase() {
    const response = `\
  Here is the JSON output for the "About Us" page based on the provided props:
{
"heading": "Our Story",
"subheading": "A Passion for Sourdough"
}
`;

    expect(parseAsJSON(response)).toEqual({
        heading: 'Our Story',
        subheading: 'A Passion for Sourdough',
    });
}

function nestedJSONTestCase() {
    const response = `\
  Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!",
"props": {
"form": {
"email": "info@example.net",
"message": "Please enter your message or inquiry below"
}
}
`;

    expect(parseAsJSON(response)).toEqual({
        heading: 'Get in Touch',
        props: {
            form: {
                email: 'info@example.net',
                message: 'Please enter your message or inquiry below',
            },
        },
        subheading: "We'd love to hear from you!",
    });
}

function missingCommasTestCase() {
    const response = `\
  Sure, here's an example of a JSON response for the "Contact Form" page:
{
"heading": "Get in Touch",
"subheading": "We'd love to hear from you!"
"props": {
"form": {
"name": "Contact Form",
"email": "info@example.net",
"message": "Please enter your message or inquiry below"
"submit": "Submit"
}
}
`;
    expect(parseAsJSON(response)).toEqual({
        heading: 'Get in Touch',
        props: {
            form: {
                email: 'info@example.net',
                message: 'Please enter your message or inquiry below',
                name: 'Contact Form',
                submit: 'Submit',
            },
        },
        subheading: "We'd love to hear from you!",
    });
}

function trailingCommasTestCase() {
    const response = `\
{
"sectionTitle": "Meet the Team",
"item1Content": "Tom Ryder - Owner & Wine Director",
"item1AttributionLine1": "Learn more about Tom's passion for wine and his journey to opening Ryders",
"item1AttributionLine2": "Read about Tom's experience in the wine industry and his approach to curating Ryders' wine list",
"item2Content": "Sarah Johnson - Wine Educator",
"item2AttributionLine1": "Discover Sarah's background in wine and her role in educating customers at Ryders",
"item2AttributionLine2": "Learn about Sarah's favorite wine pairings and her recommendations for beginners",
}`;
    expect(parseAsJSON(response)).toEqual({
        sectionTitle: 'Meet the Team',
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
    });
}

function stripInvalidJSONTestCase() {
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
"name": "Emily Chen",
"role": "Marketing Manager",
"description": "Emily is the marketing genius behind Masa Madre's success. With a background in advertising and a passion for food, she has helped to create a strong brand identity for the bakery. Emily's creativity and attention to detail have been instrumental in building a loyal customer base."

]

}
`;
    expect(parseAsJSON(response)).toEqual({
        callToAction: 'Learn More',
        heading: 'Meet the Team',
        subheading:
            'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
    });
}

function extraClosingCurliesTestCase() {
    let response = `\
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
    expect(parseAsJSON(response)).toEqual({
        heading: 'Notable Projects',
        subheading: 'Explore some of our most successful and innovative designs',
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

    response = `\
  Here is the JSON output for the "Locations" page based on the provided props:
{"contactEmail1":"info@example.net","contactPhoneNumber1":"772.555.8989","addressLine1":"123 Main St.","addressLine2":"North Lake Tahoe CA 96150","officeHours":"Monday - Friday: 9:00am - 4:30pm","officeHoursDays":"Mon - Fri"}"}`;

    expect(parseAsJSON(response)).toEqual({
        contactEmail1: 'info@example.net',
        contactPhoneNumber1: '772.555.8989',
        addressLine1: '123 Main St.',
        addressLine2: 'North Lake Tahoe CA 96150',
        officeHours: 'Monday - Friday: 9:00am - 4:30pm',
        officeHoursDays: 'Mon - Fri',
    });
}

function unterminatedStringsAndInvalidNestingTestCase() {
    const response = `\
  Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
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
    expect(parseAsJSON(response)).toEqual({
        bodyCopy:
            'At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.',
        'Here are some of the services we offer': {
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
        },
    });
}

function partialResponsesTestCase() {
    let response = `\
Sure, here's an example JSON output for the "Services" section based on the provided information:
{
"bodyCopy": "At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.
Here are some of the services we offer:
{
"contentLi`;
    expect(parseAsJSON(response)).toEqual({
        bodyCopy:
            'At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.',
        'Here are some of the services we offer': { contentLi: '' },
    });

    response = '  Here is a sample JSON output for the "Branding Portfolio"';
    expect(parseAsJSON(response)).toEqual('');

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
    expect(parseAsJSON(response)).toEqual({
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

    expect(parseAsJSON(response)).toEqual({
        subheading1: 'Explore Our News Archive',
        heading1: 'News',
        subheading2: '',
    });

    response = `\
  Here is the JSON output for the "Benefits" page:
{
"teamMemberName1": "Jane Smith",
"teamMemberImage1": "/images/team-member-1.jpg",
"teamMemberJobTitle1": "Product  Here is the JSON output for the "Testimonials" page based on the provided props:`;

    expect(parseAsJSON(response)).toEqual({
        teamMemberName1: 'Jane Smith',
        teamMemberImage1: '/images/team-member-1.jpg',
        // first quote mark is recognized as an unescaped character, final quote mark is treated as string terminus
        teamMemberJobTitle1: 'Product  Here is the JSON output for the "Testimonials',
    });

    response = '```json\n{\n  "heading": "News",\n  "';
    expect(parseAsJSON(response)).toEqual({ heading: 'News', '': '' });

    response = `\
\`\`\`json
{"items":[{"heading":"Welcome to Lava","subheading":"Your One-Stop Shop for Lava Lamps and Whisky Ice Cream","description":"Lava is a unique store located in the heart of Noe Valley, San Francisco. We specialize in selling a wide variety of lava lamps, from classic designs to modern and quirky creations. But that's not all! We also offer a delicious treat that's sure to tantalize your taste buds: free whisky ice cream for those who come in before noon. Come visit us and experience the Lava magic for yourself!","\`\`\`json
{
    "heading": "Lava Lamps",
    "subheading": "Choose from our wide selection of lava lamps in different sizes, colors, and features.",
    "items": [
      {
        "heading": "Classic Lava Lamp",
        "price": "$39.99",
        "button": "Add to Cart",
        "imageURL": "/classic-lava-lamp.jpg",
        "imageAlt": "Classic Lava Lamp"
      },
      {
        "heading": "Glowing Lava Lamp",
        "price": "$44.99",
        "button": "Add to Cart",
        "imageURL": "/`;

    expect(parseAsJSON(response)).toEqual({
        items: [
            {
                heading: 'Welcome to Lava',
                subheading: 'Your One-Stop Shop for Lava Lamps and Whisky Ice Cream',
                description:
                    "Lava is a unique store located in the heart of Noe Valley, San Francisco. We specialize in selling a wide variety of lava lamps, from classic designs to modern and quirky creations. But that's not all! We also offer a delicious treat that's sure to tantalize your taste buds: free whisky ice cream for those who come in before noon. Come visit us and experience the Lava magic for yourself!",
                '```json': {
                    heading: 'Lava Lamps',
                    subheading:
                        'Choose from our wide selection of lava lamps in different sizes, colors, and features.',
                    items: [
                        {
                            heading: 'Classic Lava Lamp',
                            price: '$39.99',
                            button: 'Add to Cart',
                            imageURL: '/classic-lava-lamp.jpg',
                            imageAlt: 'Classic Lava Lamp',
                        },
                        {
                            heading: 'Glowing Lava Lamp',
                            price: '$44.99',
                            button: 'Add to Cart',
                            imageURL: '/',
                        },
                    ],
                },
            },
        ],
    });
}

function preambleTestCase() {
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

    expect(parseAsJSON(response)).toEqual({
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
}

function missingCurliesTestCase() {
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
    expect(parseAsJSON(response)).toEqual({
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
}

function restartsMidResponseTestCase() {
    let response = `\
  Sure, here's an example JSON output for the "Contributor Profiles" section:
{
"sectionTitle": "Our Contributors",
"sectionDescription": "Meet the talented team of writers, analysts, and experts who make Defector possible.",
"itemSubtitle1": "Sports Journalist",
"itemTitle1": "Joe Smith",
"itemDescription1": "Joe is a veteran sports journalist with over 10 years of experience covering the NFL, NBA, and MLB. He has written for several major publications and is known for his in-depth analysis and insightful commentary.",
"itemSubtitle2": "Data Analyst",
"itemTitle2": "Jane Doe",
"itemDescription2": "Jane is a data analyst with a background in statistics and computer  Sure, here's an example JSON output for the "Contributor Profiles" section:
{
"sectionTitle": "Our Contributors",
"sectionDescription": "Meet the talented team of writers, analysts, and experts who make Defector possible.",
"itemSubtitle1": "Sports Journalist",
"itemTitle1": "Joe Smith",
"itemDescription1": "Joe is a veteran sports journalist with over 10 years of experience covering the NFL, NBA, and MLB. He has written for several major publications and is known for his in-depth analysis and insightful commentary."
"itemSubtitle2": "Data Analyst",
"itemTitle2": "Jane Doe",
"itemDescription2": "Jane is a data analyst with a background in statistics and computer science. She uses her skills to provide detailed analysis and visualizations of sports data, helping readers gain a deeper understanding of the game."
"itemSubtitle3": "Sports Historian",
"itemTitle3": "John Johnson",
"itemDescription3": "John is a sports historian with a Ph.D. in American Studies. He has written several books on the history of sports and is a frequent guest on sports talk shows, providing historical context and perspective."
}`;

    expect(parseAsJSON(response)).toEqual({
        sectionTitle: 'Our Contributors',
        sectionDescription:
            'Meet the talented team of writers, analysts, and experts who make Defector possible.',
        itemSubtitle1: 'Sports Journalist',
        itemTitle1: 'Joe Smith',
        itemDescription1:
            'Joe is a veteran sports journalist with over 10 years of experience covering the NFL, NBA, and MLB. He has written for several major publications and is known for his in-depth analysis and insightful commentary.',
        itemSubtitle2: 'Data Analyst',
        itemTitle2: 'Jane Doe',
        itemDescription2:
            'Jane is a data analyst with a background in statistics and computer science. She uses her skills to provide detailed analysis and visualizations of sports data, helping readers gain a deeper understanding of the game.',
        itemSubtitle3: 'Sports Historian',
        itemTitle3: 'John Johnson',
        itemDescription3:
            'John is a sports historian with a Ph.D. in American Studies. He has written several books on the history of sports and is a frequent guest on sports talk shows, providing historical context and perspective.',
    });

    response = `\`\`\`json
{
    "heading": "New Moon Natural Foods",
    "subheading": "Your Community Market for Organic & Natural Goods",
    "imageURL":\`\`\`json
{
    "heading": "New Moon Natural Foods: Your Community Market",
    "subheading": "Welcome to a Healthier Way of Life",
    "description": "At New Moon Natural Foods, we are committed to providing our community with the highest quality organic produce, locally-sourced meats, and carefully curated health and wellness products. We also offer a unique selection of beer, wine, and cheese, as well as all the best in natural grocery. Our family-owned market is dedicated to supporting local growers and artisans, while providing a welcoming and supportive environment for our customers to find the healthiest and most sustainable options for their families. Join us on your journey to a healthier way of life."
}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        heading: 'New Moon Natural Foods: Your Community Market',
        subheading: 'Welcome to a Healthier Way of Life',
        description:
            'At New Moon Natural Foods, we are committed to providing our community with the highest quality organic produce, locally-sourced meats, and carefully curated health and wellness products. We also offer a unique selection of beer, wine, and cheese, as well as all the best in natural grocery. Our family-owned market is dedicated to supporting local growers and artisans, while providing a welcoming and supportive environment for our customers to find the healthiest and most sustainable options for their families. Join us on your journey to a healthier way of life.',
    });

    response = `\
  Here is the JSON output for the "Benefits" page:
{
"teamMemberName1": "John Doe",
"teamMemberImage1": "/images/team-member-1.jpg",
"teamMemberJobTitle1": "Senior Sales Consultant",
"teamMemberName2": "Jane Smith",
"teamMemberImage2": "/images/team-member-2.jpg",
"teamMemberJobTitle2": "Product  Here is the JSON output for the "Testimonials" page based on the provided props:
{
"teamMemberName1": "John Doe",
"teamMemberImage1": "/images/john-doe.jpg",
"teamMemberJobTitle1": "Regional Manager",
"teamMemberName2": "Jane Smith",
"teamMemberImage2": "/images/jane-smith.jpg",
"teamMemberJobTitle2": "Senior Consultant",
"teamMemberName3": "Bob Johnson",
"teamMemberImage3": "/images/bob-johnson.jpg",
}
`;
    expect(parseAsJSON(response)).toEqual({
        teamMemberName1: 'John Doe',
        teamMemberImage1: '/images/john-doe.jpg',
        teamMemberJobTitle1: 'Regional Manager',
        teamMemberName2: 'Jane Smith',
        teamMemberImage2: '/images/jane-smith.jpg',
        teamMemberJobTitle2: 'Senior Consultant',
        teamMemberName3: 'Bob Johnson',
        teamMemberImage3: '/images/bob-johnson.jpg',
    });
}

function markdownTableTestCase() {
    const response = `\
  Here are the props for Vytas' Hatha Yoga classes:
Props:
| Prop Name | Value |
| blogPostImage1 | /vytas-yoga-class-background.jpg |
| shortBlogPostCaption1 | "Find inner peace and balance through physical postures and breathing techniques" |
| blogPostHeading1 | "Hatha Yoga Classes with Vytas" |
| miniBlogPostLede1 | "Discover the transformative power of Hatha Yoga with Vytas, a seasoned yoga teacher" |
| blogPostImage2 | /vytas-yoga-community-background.jpg |
| shortBlogPostCaption2 | "Join a supportive community of like-minded individuals and deepen your practice with Vytas" |
| blogPostHeading2 | "Community and Connection" |
| miniBlogPostLede2 | "Vytas' Hatha Yoga classes offer a sense of community and connection, fostering a supportive environment for all practitioners" | |`;

    expect(parseAsJSON(response)).toEqual({
        'Prop Name': 'Value',
        blogPostImage1: '/vytas-yoga-class-background.jpg',
        shortBlogPostCaption1:
            'Find inner peace and balance through physical postures and breathing techniques',
        blogPostHeading1: 'Hatha Yoga Classes with Vytas',
        miniBlogPostLede1:
            'Discover the transformative power of Hatha Yoga with Vytas, a seasoned yoga teacher',
        blogPostImage2: '/vytas-yoga-community-background.jpg',
        shortBlogPostCaption2:
            'Join a supportive community of like-minded individuals and deepen your practice with Vytas',
        blogPostHeading2: 'Community and Connection',
        miniBlogPostLede2:
            "Vytas' Hatha Yoga classes offer a sense of community and connection, fostering a supportive environment for all practitioners",
    });
}

function preservesNewLinesTestCase() {
    const response = `\
\`\`\`json
{
    "items": [
        {
            "heading": "The Zombie",
            "subheading": "A Tiki Drink with a Twist",
            "description": "Ingredients\\n\\n1 ounce fresh lime juice\n1 ounce falernum\\n1 ounce passion fruit purée\\n1 ounce pineapple juice\\n1 ounce white rum\\n1 ounce dark rum\\n1 dash Angostura bitters\\n1 dash Pernod\\n\\nInstructions\\n\\n1. Combine all ingredients in a cocktail shaker with ice.\\n2. Shake until well chilled.\\n3. Strain into a chilled tiki mug or highball glass filled with crushed ice.\\n4. Garnish with a sprig of mint and a cherry.",
            "imageURL": "/the-zombie-tiki-drink.jpg",
            "imageAlt": "",
            "imageCaption": ""
        }
    ]
}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        items: [
            {
                heading: 'The Zombie',
                subheading: 'A Tiki Drink with a Twist',
                description:
                    'Ingredients\n\n1 ounce fresh lime juice\n1 ounce falernum\n1 ounce passion fruit purée\n1 ounce pineapple juice\n1 ounce white rum\n1 ounce dark rum\n1 dash Angostura bitters\n1 dash Pernod\n\nInstructions\n\n1. Combine all ingredients in a cocktail shaker with ice.\n2. Shake until well chilled.\n3. Strain into a chilled tiki mug or highball glass filled with crushed ice.\n4. Garnish with a sprig of mint and a cherry.',
                imageURL: '/the-zombie-tiki-drink.jpg',
                imageAlt: '',
                imageCaption: '',
            },
        ],
    });
}

function extraneousEscapeCharactersTestCase() {
    const response =
        '```json\n{"heading":"Print Design","description":"\\\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life."}\n```';

    expect(parseAsJSON(response)).toEqual({
        heading: 'Print Design',
        description:
            '\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life.',
    });
}

function unescapedDoubleQuotesTestCase() {
    let response =
        '```json\n{"heading":"The Team","subheading":"Meet the Starters","items":[{"heading":"Offense","subheading":"Quarterbacks","items":[{"heading":"1","subheading":"Jared Goff","description":"Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.","imageURL":"/players/jared-goff.jpg","imageAlt":"Jared Goff","imageCaption":"Jared Goff in action","linkURL":"/players/jared-goff"}],';

    expect(parseAsJSON(response)).toEqual({
        heading: 'The Team',
        subheading: 'Meet the Starters',
        items: [
            {
                heading: 'Offense',
                subheading: 'Quarterbacks',
                items: [
                    {
                        heading: '1',
                        subheading: 'Jared Goff',
                        description:
                            'Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.',
                        imageURL: '/players/jared-goff.jpg',
                        imageAlt: 'Jared Goff',
                        imageCaption: 'Jared Goff in action',
                        linkURL: '/players/jared-goff',
                    },
                ],
            },
        ],
    });

    response =
        '```json\n{"items":[{"heading":"Our History","description":"Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.","imageURL":"/something-awful-history.jpg","imageAlt":"Something Awful Founder Richard \'Lowtax\' Kyanka"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        items: [
            {
                heading: 'Our History',
                description:
                    'Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.',
                imageURL: '/something-awful-history.jpg',
                imageAlt: "Something Awful Founder Richard 'Lowtax' Kyanka",
            },
        ],
    });
}

function prematureClosingCurliesTestCase() {
    let response =
        '```json\n{"heading":"Organic Produce","subheading":"The Benefits of Going Organic","description":"Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers."},"items":[{"heading":"Organic Fruits","subheading":"Nature\'s Sweet Treats"},{"heading":"Organic Vegetables","subheading":"Fresh from the Garden"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        heading: 'Organic Produce',
        subheading: 'The Benefits of Going Organic',
        description:
            'Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers.',
        items: [
            {
                heading: 'Organic Fruits',
                subheading: "Nature's Sweet Treats",
            },
            {
                heading: 'Organic Vegetables',
                subheading: 'Fresh from the Garden',
            },
        ],
    });

    response =
        '{"heading": "Get in Touch"}\n"items": [{"heading": "Contact Information","subheading": "Reach out to us using the following details."}]<|im_end|>';

    expect(parseAsJSON(response)).toEqual({
        heading: 'Get in Touch',
        items: [
            {
                heading: 'Contact Information',
                subheading: 'Reach out to us using the following details.',
            },
        ],
    });
}

function missingValuesTestCase() {
    const response = `\
\`\`\`json
{"heading":"Digg FAQ","subheading":"Get the Answers You Need","items":[{"heading":"What is Digg?","subheading":"","description":"Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.","button":""},{"heading":"How does Digg work?","subheading","description":"Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.","button":""},{"heading":"How do I submit a story to Digg?","subheading","description":"To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.","button":""}]}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        heading: 'Digg FAQ',
        subheading: 'Get the Answers You Need',
        items: [
            {
                heading: 'What is Digg?',
                subheading: '',
                description:
                    'Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.',
                button: '',
            },
            {
                heading: 'How does Digg work?',
                subheading: '',
                description:
                    'Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.',
                button: '',
            },
            {
                heading: 'How do I submit a story to Digg?',
                subheading: '',
                description:
                    "To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.",
                button: '',
            },
        ],
    });
}
