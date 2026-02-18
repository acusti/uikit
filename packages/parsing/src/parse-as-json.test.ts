import { describe, expect, it } from 'vitest';

import { getPreviousStringType, parseAsJSON } from './parse-as-json.js';

describe('@acusti/parsing', () => {
    describe('getPreviousStringType', () => {
        it('returns KEY if the previous string token is an object key', () => {
            expect(getPreviousStringType('{"foo": "')).toBe('KEY');
        });

        it('returns VALUE if the previous string token is not an object key', () => {
            expect(getPreviousStringType('{"foo": "bar", "')).toBe('VALUE');
        });

        it('returns null if the previous token isn’t a string', () => {
            expect(getPreviousStringType('{"foo": 42, "')).toBe(null);
            expect(getPreviousStringType('{"foo": ["one", "two"]')).toBe(null);
        });
    });

    describe('parseAsJSON', () => {
        it('returns value as null when input is empty', () => {
            // @ts-expect-error testing invalid input
            expect(parseAsJSON()).toEqual({ postscript: '', preamble: '', value: null });
            // @ts-expect-error testing invalid input
            expect(parseAsJSON(null)).toEqual({
                postscript: '',
                preamble: '',
                value: null,
            });
            expect(parseAsJSON('')).toEqual({
                postscript: '',
                preamble: '',
                value: null,
            });
        });
        it('converts a LLM response string to a JSON object', convertToJSONTestCase);
        it('handles nested JSON structures', nestedJSONTestCase);
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
        it('detects and strips detailed pre- and post-amble text', preambleTestCase);
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
            'handles fenced JSON with percent signs and nested arrays of objects',
            fencedJSONWithPercentSignsTestCase,
        );
        it(
            'handles fenced JSON variants including indentation and blank lines',
            fencedJSONVariantsTestCase,
        );
        it(
            'detects premature closing curly brace and ignores it',
            prematureClosingCurliesTestCase,
        );
        it(
            'detects an object key with a missing value and fills it in',
            missingValuesTestCase,
        );
        it('handles nested arrays without issue', nestedArraysTestCase);
        it('handles number values', numberValuesTestCase);
        it(
            'handles missing opening quotemarks for object keys',
            missingOpeningQuoteTestCase,
        );
        it(
            'cleanly dilineates between preamble and JSON results',
            extractPreambleTestCase,
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
        postscript: '',
        preamble:
            'Here is the JSON output for the "About Us" page based on the provided props:',
        value: {
            heading: 'Our Story',
            subheading: 'A Passion for Sourdough',
        },
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
        postscript: '',
        preamble: '',
        value: {
            heading: 'Notable Projects',
            projects: [
                {
                    altText: 'Skyscraper',
                    description:
                        'Design for a new skyscraper in the city center, featuring a sleek and modern aesthetic. The building features a large atrium and floor-to-ceiling windows, providing an abundance of natural light and stunning views of the city skyline.',
                    image: 'https://pentagram.com/images/skyscraper.jpg',
                },
                {
                    altText: 'Non-Profit Organization',
                    description:
                        'Website design for a non-profit organization, featuring a clean and intuitive layout, with a focus on accessibility and user experience. The goal was to create a user-friendly platform that would allow the organization to effectively communicate their mission and goals.',
                    image: 'https://pentagram.com/images/non-profit.jpg',
                },
            ],
            subheading: 'Explore some of our most successful and innovative designs',
        },
    });

    response = `\
  Here is the JSON output for the "Locations" page based on the provided props:
{"contactEmail1":"info@example.net","contactPhoneNumber1":"772.555.8989","addressLine1":"123 Main St.","addressLine2":"North Lake Tahoe CA 96150","officeHours":"Monday - Friday: 9:00am - 4:30pm","officeHoursDays":"Mon - Fri"}"}`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble:
            'Here is the JSON output for the "Locations" page based on the provided props:',
        value: {
            addressLine1: '123 Main St.',
            addressLine2: 'North Lake Tahoe CA 96150',
            contactEmail1: 'info@example.net',
            contactPhoneNumber1: '772.555.8989',
            officeHours: 'Monday - Friday: 9:00am - 4:30pm',
            officeHoursDays: 'Mon - Fri',
        },
    });
}

function extractPreambleTestCase() {
    expect(
        parseAsJSON(
            `To create a section prompt for a block-quote section on the "Home" page at index 1, I will consider the context and existing section prompts.\n\nThe "Home" page already has a hero section that introduces Franklin Investments, a brief introduction to the company, a gallery of key projects, a features section highlighting their strategic advantages, and a call-to-action section. \n\nA block-quote section at index 1 would logically serve as a highlight or a key message that the company wants to emphasize to its visitors right after they are introduced to the company. \n\nGiven the description of the block-quote section as “Bold statement, phrase or quote,” it seems this section is meant to capture the essence of Franklin Investments' mission, philosophy, or value proposition in a concise and impactful way.\n\nHere's a JSON-formatted section prompt:\n\n\`\`\`\n{\n  "prompt": "A bold statement that encapsulates Franklin Investments' commitment to innovation and excellence in infrastructure solutions, resonating with their mission and values."\n}\n\`\`\`\n\nThis prompt is designed to elicit a concise yet powerful statement that can reinforce the company's message and leave a lasting impression on visitors.`,
        ),
    ).toEqual({
        postscript: `This prompt is designed to elicit a concise yet powerful statement that can reinforce the company's message and leave a lasting impression on visitors.`,
        preamble: `To create a section prompt for a block-quote section on the "Home" page at index 1, I will consider the context and existing section prompts.\n\nThe "Home" page already has a hero section that introduces Franklin Investments, a brief introduction to the company, a gallery of key projects, a features section highlighting their strategic advantages, and a call-to-action section. \n\nA block-quote section at index 1 would logically serve as a highlight or a key message that the company wants to emphasize to its visitors right after they are introduced to the company. \n\nGiven the description of the block-quote section as “Bold statement, phrase or quote,” it seems this section is meant to capture the essence of Franklin Investments' mission, philosophy, or value proposition in a concise and impactful way.\n\nHere's a JSON-formatted section prompt:`,
        value: {
            prompt: "A bold statement that encapsulates Franklin Investments' commitment to innovation and excellence in infrastructure solutions, resonating with their mission and values.",
        },
    });
}

function extraneousEscapeCharactersTestCase() {
    const response =
        '```json\n{"heading":"Print Design","description":"\\\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life."}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            description:
                '\nAt Cinco Design, we believe that print design is not just about creating visually appealing materials, but also about effectively communicating your message to your target audience. Our team of experienced designers works closely with you to understand your brand, your audience, and your goals, and then crafts a unique print design solution that captures your essence and resonates with your audience.\n\nOur print design services include:\n\n- Branding and identity design: We create a cohesive visual identity for your brand, including logos, business cards, letterheads, and more.\n- Marketing collateral: We design brochures, flyers, posters, and other marketing materials that effectively promote your products or services.\n- Packaging design: We design packaging that not only protects your products but also enhances their appeal and makes them stand out on the shelf.\n- Publication design: We design magazines, newspapers, books, and other publications that are visually engaging and easy to navigate.\n\nLet us help you make a lasting impression with our print design services. Contact us today to discuss your project and see how we can bring your vision to life.',
            heading: 'Print Design',
        },
    });
}

function fencedJSONVariantsTestCase() {
    expect(
        parseAsJSON(`\
\`\`\`json

{
  "heading": "News"
}

\`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });

    expect(
        parseAsJSON(`\
\`\`\`JSON
{
  "heading": "News"
}
\`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });

    expect(
        parseAsJSON(`\
  \`\`\`json
  {
    "heading": "News"
  }
  \`\`\``),
    ).toEqual({
        postscript: '',
        preamble: '',
        value: { heading: 'News' },
    });
}

function fencedJSONWithPercentSignsTestCase() {
    const response = `\
\`\`\`json
{
  "heading": "Our Impact & Milestones",
  "subheading": "Rooted in the earth and woven with intention, our achievements reflect a commitment to a kinder, more sustainable world.",
  "imagePrompt": "A high-resolution, minimalist composition of natural elements: a bundle of raw flax, a smooth river stone, and a recycled paper certificate with a botanical seal, all bathed in soft, golden morning light on a light oak surface.",
  "items": [
    {
      "heading": "12 Global Artisan Communities",
      "subheading": "Supporting traditional craftsmanship in 8 countries.",
      "description": "We partner directly with small-scale cooperatives from Kyoto to Oregon, ensuring fair wages and preserving ancestral techniques that have been passed down for generations.",
      "button": "Meet the Makers",
      "buttonLink": {
        "enabled": true,
        "label": "Meet the Makers",
        "type": "internal",
        "value": "/journal"
      },
      "imageAlt": "An artisan's hands weaving on a traditional wooden loom",
      "imagePrompt": "Close-up of weathered hands working on a large wooden loom, weaving cream-colored linen thread, soft-focus background of a sunlit workshop.",
      "id": "0"
    },
    {
      "heading": "450k Gallons of Water Saved",
      "subheading": "Through organic flax and closed-loop dyeing.",
      "description": "By prioritizing organic Belgian flax over conventional cotton and utilizing rainwater harvesting in our ceramic studios, we significantly reduce our environmental footprint.",
      "button": "Our Sourcing Journey",
      "buttonLink": {
        "enabled": true,
        "label": "Our Sourcing Journey",
        "type": "internal",
        "value": "fbbe35e2-c76b-4ae4-9c26-774160ebbda2"
      },
      "imageAlt": "A serene view of a lush flax field under a clear sky",
      "imagePrompt": "A wide, cinematic shot of a flowering flax field in the European countryside, soft blue flowers swaying in the breeze under a pale morning sky.",
      "id": "1"
    },
    {
      "heading": "100% GOTS & OEKO-TEX Certified",
      "subheading": "Rigorous standards for textile safety and ecology.",
      "description": "Every thread in our collection is verified free from harmful chemicals and synthetic dyes, ensuring a healthy, non-toxic sanctuary for your family.",
      "button": "View Standards",
      "buttonLink": {
        "enabled": true,
        "label": "View Standards",
        "type": "external",
        "value": "https://www.global-standard.org/"
      },
      "imageAlt": "A close-up of a GOTS certification tag on a linen throw",
      "imagePrompt": "Macro photography of a recycled paper hangtag with a green botanical logo attached to a heavily textured oatmeal-colored linen fabric.",
      "id": "2"
    },
    {
      "heading": "Carbon-Neutral Shipping",
      "subheading": "Offsetting every delivery through reforestation.",
      "description": "We partner with global reforestation projects to offset 100% of the carbon emitted from our studio to your doorstep, keeping the air as clean as our designs.",
      "button": "Read Our Report",
      "buttonLink": {
        "enabled": true,
        "label": "Read Our Report",
        "type": "internal",
        "value": "/ethos"
      },
      "imageAlt": "A young sapling growing in a sunlit forest",
      "imagePrompt": "A delicate green sapling emerging from rich, dark forest soil, dappled sunlight filtering through tall trees in the background.",
      "id": "3"
    }
  ]
}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Our Impact & Milestones',
            imagePrompt:
                'A high-resolution, minimalist composition of natural elements: a bundle of raw flax, a smooth river stone, and a recycled paper certificate with a botanical seal, all bathed in soft, golden morning light on a light oak surface.',
            items: [
                {
                    button: 'Meet the Makers',
                    buttonLink: {
                        enabled: true,
                        label: 'Meet the Makers',
                        type: 'internal',
                        value: '/journal',
                    },
                    description:
                        'We partner directly with small-scale cooperatives from Kyoto to Oregon, ensuring fair wages and preserving ancestral techniques that have been passed down for generations.',
                    heading: '12 Global Artisan Communities',
                    id: '0',
                    imageAlt: "An artisan's hands weaving on a traditional wooden loom",
                    imagePrompt:
                        'Close-up of weathered hands working on a large wooden loom, weaving cream-colored linen thread, soft-focus background of a sunlit workshop.',
                    subheading: 'Supporting traditional craftsmanship in 8 countries.',
                },
                {
                    button: 'Our Sourcing Journey',
                    buttonLink: {
                        enabled: true,
                        label: 'Our Sourcing Journey',
                        type: 'internal',
                        value: 'fbbe35e2-c76b-4ae4-9c26-774160ebbda2',
                    },
                    description:
                        'By prioritizing organic Belgian flax over conventional cotton and utilizing rainwater harvesting in our ceramic studios, we significantly reduce our environmental footprint.',
                    heading: '450k Gallons of Water Saved',
                    id: '1',
                    imageAlt: 'A serene view of a lush flax field under a clear sky',
                    imagePrompt:
                        'A wide, cinematic shot of a flowering flax field in the European countryside, soft blue flowers swaying in the breeze under a pale morning sky.',
                    subheading: 'Through organic flax and closed-loop dyeing.',
                },
                {
                    button: 'View Standards',
                    buttonLink: {
                        enabled: true,
                        label: 'View Standards',
                        type: 'external',
                        value: 'https://www.global-standard.org/',
                    },
                    description:
                        'Every thread in our collection is verified free from harmful chemicals and synthetic dyes, ensuring a healthy, non-toxic sanctuary for your family.',
                    heading: '100% GOTS & OEKO-TEX Certified',
                    id: '2',
                    imageAlt: 'A close-up of a GOTS certification tag on a linen throw',
                    imagePrompt:
                        'Macro photography of a recycled paper hangtag with a green botanical logo attached to a heavily textured oatmeal-colored linen fabric.',
                    subheading: 'Rigorous standards for textile safety and ecology.',
                },
                {
                    button: 'Read Our Report',
                    buttonLink: {
                        enabled: true,
                        label: 'Read Our Report',
                        type: 'internal',
                        value: '/ethos',
                    },
                    description:
                        'We partner with global reforestation projects to offset 100% of the carbon emitted from our studio to your doorstep, keeping the air as clean as our designs.',
                    heading: 'Carbon-Neutral Shipping',
                    id: '3',
                    imageAlt: 'A young sapling growing in a sunlit forest',
                    imagePrompt:
                        'A delicate green sapling emerging from rich, dark forest soil, dappled sunlight filtering through tall trees in the background.',
                    subheading: 'Offsetting every delivery through reforestation.',
                },
            ],
            subheading:
                'Rooted in the earth and woven with intention, our achievements reflect a commitment to a kinder, more sustainable world.',
        },
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
        postscript: '',
        preamble: "Here are the props for Vytas' Hatha Yoga classes:\nProps:",
        value: {
            blogPostHeading1: 'Hatha Yoga Classes with Vytas',
            blogPostHeading2: 'Community and Connection',
            blogPostImage1: '/vytas-yoga-class-background.jpg',
            blogPostImage2: '/vytas-yoga-community-background.jpg',
            miniBlogPostLede1:
                'Discover the transformative power of Hatha Yoga with Vytas, a seasoned yoga teacher',
            miniBlogPostLede2:
                "Vytas' Hatha Yoga classes offer a sense of community and connection, fostering a supportive environment for all practitioners",
            'Prop Name': 'Value',
            shortBlogPostCaption1:
                'Find inner peace and balance through physical postures and breathing techniques',
            shortBlogPostCaption2:
                'Join a supportive community of like-minded individuals and deepen your practice with Vytas',
        },
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
        postscript: '',
        preamble:
            'Sure, here\'s an example of a JSON response for the "Contact Form" page:',
        value: {
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
        },
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
        postscript: '',
        preamble: 'Here are the props for the "Blog" page:\nProps:',
        value: {
            blogPostHeading1: 'The Magic of Sourdough',
            blogPostHeading2: 'Our Journey to Your Table',
            blogPostHeading3: 'Learn the Basics of Artisanal Bread Making',
            blogPostImage1: '/images/blog-post-image1.jpg',
            blogPostImage2: '/images/blog-post-image2.jpg',
            blogPostImage3: '/images/blog-post-image3.jpg',
            blogPostLede1:
                "At Masa Madre, we're passionate about creating the perfect sourdough bread. Learn more about the art and craft of this ancient tradition.",
            blogPostLede2:
                'Discover the journey of our sourdough bread, from the seed to the loaf.',
            blogPostLede3:
                "Get started on your sourdough journey with our beginner's guide to artisanal bread making.",
            blogPostSubheading1: 'Exploring the Art of Sourdough Baking',
            blogPostSubheading2: 'From Seed to Loaf',
            blogPostSubheading3: 'Sourdough 101',
        },
    });
}

function missingOpeningQuoteTestCase() {
    const response =
        '{"heading":"The Unbreakable Bond"\ndescription":"In a world ravaged by chaos and despair, the heartwarming relationship between Big Man and Sweet Tooth stands as a beacon of hope and love. As Big Man takes the young hybrid under his wing, nurturing him with unwavering devotion, the two forge an unbreakable bond that transcends the boundaries of blood and biology."}<|im_end|>';
    expect(parseAsJSON(response).value).toEqual({
        description:
            'In a world ravaged by chaos and despair, the heartwarming relationship between Big Man and Sweet Tooth stands as a beacon of hope and love. As Big Man takes the young hybrid under his wing, nurturing him with unwavering devotion, the two forge an unbreakable bond that transcends the boundaries of blood and biology.',
        heading: 'The Unbreakable Bond',
    });
}

function missingValuesTestCase() {
    const response = `\
\`\`\`json
{"heading":"Digg FAQ","subheading":"Get the Answers You Need","items":[{"heading":"What is Digg?","subheading":"","description":"Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.","button":""},{"heading":"How does Digg work?","subheading","description":"Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.","button":""},{"heading":"How do I submit a story to Digg?","subheading","description":"To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.","button":""}]}
\`\`\``;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Digg FAQ',
            items: [
                {
                    button: '',
                    description:
                        'Digg is an American news aggregator that curates a front page of the most popular stories on the Internet. It covers topics such as science, trending political issues, and viral Internet issues.',
                    heading: 'What is Digg?',
                    subheading: '',
                },
                {
                    button: '',
                    description:
                        'Digg uses a combination of editorial curation and algorithmic sorting to select the most popular stories on the Internet. Users can submit stories, which are then voted on by other users. The stories with the most votes appear on the Digg front page.',
                    heading: 'How does Digg work?',
                    subheading: '',
                },
                {
                    button: '',
                    description:
                        "To submit a story to Digg, you need to create an account and then click on the 'Submit a Story' button. You will then be prompted to enter the URL of the story you want to submit. Once submitted, other users can vote on your story, and if it gains enough votes, it may appear on the Digg front page.",
                    heading: 'How do I submit a story to Digg?',
                    subheading: '',
                },
            ],
            subheading: 'Get the Answers You Need',
        },
    });
}

function nestedArraysTestCase() {
    const response = `{"heading": "Registration Form", "items": [{"heading": "Personal Information", "fields": [{"label": "Name", "name": "name", "type": "text", "placeholder": "Enter your name"}, {"label": "Gender", "name": "gender", "type": "select", "options": ["Male", "Female", "Other"], "placeholder": "Select your gender"}]}], "button": "Next: Security Details"}]}<|im_end|>`;

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            button: 'Next: Security Details',
            heading: 'Registration Form',
            items: [
                {
                    fields: [
                        {
                            label: 'Name',
                            name: 'name',
                            placeholder: 'Enter your name',
                            type: 'text',
                        },
                        {
                            label: 'Gender',
                            name: 'gender',
                            options: ['Male', 'Female', 'Other'],
                            placeholder: 'Select your gender',
                            type: 'select',
                        },
                    ],
                    heading: 'Personal Information',
                },
            ],
        },
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
        postscript: '',
        preamble:
            'Sure, here\'s an example of a JSON response for the "Contact Form" page:',
        value: {
            heading: 'Get in Touch',
            props: {
                form: {
                    email: 'info@example.net',
                    message: 'Please enter your message or inquiry below',
                },
            },
            subheading: "We'd love to hear from you!",
        },
    });
}

function numberValuesTestCase() {
    const response = '[{"foo":0}\n{"bar": 1}{"baz": "qux"}]<|im_end|>';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: [{ foo: 0 }, { bar: 1 }, { baz: 'qux' }],
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
        postscript: '',
        preamble:
            'Sure, here\'s an example JSON output for the "Services" section based on the provided information:',
        value: {
            bodyCopy:
                'At the Cleveland Clinic Wound Center in Vero Beach, Florida, our team of experienced healthcare professionals is dedicated to getting you back to your normal life as quickly as possible.',
            'Here are some of the services we offer': { contentLi: '' },
        },
    });

    response = '  Here is a sample JSON output for the "Branding Portfolio"';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: 'Here is a sample JSON output for the "Branding Portfolio',
        value: '',
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
    expect(parseAsJSON(response).value).toEqual({
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

    expect(parseAsJSON(response).value).toEqual({
        heading1: 'News',
        subheading1: 'Explore Our News Archive',
        subheading2: '',
    });

    response = `\
  Here is the JSON output for the "Benefits" page:
{
"teamMemberName1": "Jane Smith",
"teamMemberImage1": "/images/team-member-1.jpg",
"teamMemberJobTitle1": "Product  Here is the JSON output for the "Testimonials" page based on the provided props:`;

    expect(parseAsJSON(response)).toEqual({
        postscript: 'page based on the provided props:',
        preamble: 'Here is the JSON output for the "Benefits" page:',
        value: {
            teamMemberImage1: '/images/team-member-1.jpg',
            // first quote mark is recognized as an unescaped character, final quote mark is treated as string terminus
            teamMemberJobTitle1: 'Product  Here is the JSON output for the "Testimonials',
            teamMemberName1: 'Jane Smith',
        },
    });

    response = '```json\n{\n  "heading": "News",\n  "';
    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: { '': '', heading: 'News' },
    });

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

    expect(parseAsJSON(response).value).toEqual({
        items: [
            {
                '```json': {
                    heading: 'Lava Lamps',
                    items: [
                        {
                            button: 'Add to Cart',
                            heading: 'Classic Lava Lamp',
                            imageAlt: 'Classic Lava Lamp',
                            imageURL: '/classic-lava-lamp.jpg',
                            price: '$39.99',
                        },
                        {
                            button: 'Add to Cart',
                            heading: 'Glowing Lava Lamp',
                            imageURL: '/',
                            price: '$44.99',
                        },
                    ],
                    subheading:
                        'Choose from our wide selection of lava lamps in different sizes, colors, and features.',
                },
                description:
                    "Lava is a unique store located in the heart of Noe Valley, San Francisco. We specialize in selling a wide variety of lava lamps, from classic designs to modern and quirky creations. But that's not all! We also offer a delicious treat that's sure to tantalize your taste buds: free whisky ice cream for those who come in before noon. Come visit us and experience the Lava magic for yourself!",
                heading: 'Welcome to Lava',
                subheading: 'Your One-Stop Shop for Lava Lamps and Whisky Ice Cream',
            },
        ],
    });
}

function preambleTestCase() {
    const preamble = `Sure, here's an example JSON output for the "Types of Lessons" section based on the provided props:`;
    const postscript = `This output includes the following props:

* "sectionSubtitle": A subtitle for the section, which is "Dance Lessons for All Levels".
* "sectionTitle": The title of the section, which is "Lessons Offered".
* "itemSubtitle1", "itemTitle1", "itemDescription1": These props are used to define the first item in the list of lessons, which is beginner. The subtitle is "Beginner", the title is "Introduction to Latin Dance", and the description is "Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills."
* "itemSubtitle2", "itemTitle2", "itemDescription2": These props are used to define the second item in the list of lessons, which is intermediate. The subtitle is "Intermediate", the title is "Advanced Techniques", and the description is "Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance."
* "link": The link prop is used to define the URL of the lessons page, which is "https://marteeeen.com/lessons/".".`;
    const response = `\
  ${preamble}
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

${postscript}`;

    expect(parseAsJSON(response)).toEqual({
        postscript,
        preamble,
        value: {
            itemDescription1:
                'Learn the basics of Latin dance, including salsa, bachata, and cha cha cha. Perfect for beginners looking to get started or those who want to refresh their skills.',
            itemDescription2:
                'Build on your existing skills and learn more complex moves and patterns. Suitable for those with some experience in Latin dance.',
            itemSubtitle1: 'Beginner',
            itemSubtitle2: 'Intermediate',
            itemTitle1: 'Introduction to Latin Dance',
            itemTitle2: 'Advanced Techniques',
            link: 'https://marteeeen.com/lessons/',
            sectionSubtitle: 'Dance Lessons for All Levels',
            sectionTitle: 'Lessons Offered',
        },
    });
}

function prematureClosingCurliesTestCase() {
    let response =
        '```json\n{"heading":"Organic Produce","subheading":"The Benefits of Going Organic","description":"Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers."},"items":[{"heading":"Organic Fruits","subheading":"Nature\'s Sweet Treats"},{"heading":"Organic Vegetables","subheading":"Fresh from the Garden"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            description:
                'Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers.',
            heading: 'Organic Produce',
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
            subheading: 'The Benefits of Going Organic',
        },
    });

    response =
        '{"heading": "Get in Touch"}\n"items": [{"heading": "Contact Information","subheading": "Reach out to us using the following details."}]<|im_end|>';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'Get in Touch',
            items: [
                {
                    heading: 'Contact Information',
                    subheading: 'Reach out to us using the following details.',
                },
            ],
        },
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
        postscript: '',
        preamble: '',
        value: {
            items: [
                {
                    description:
                        'Ingredients\n\n1 ounce fresh lime juice\n1 ounce falernum\n1 ounce passion fruit purée\n1 ounce pineapple juice\n1 ounce white rum\n1 ounce dark rum\n1 dash Angostura bitters\n1 dash Pernod\n\nInstructions\n\n1. Combine all ingredients in a cocktail shaker with ice.\n2. Shake until well chilled.\n3. Strain into a chilled tiki mug or highball glass filled with crushed ice.\n4. Garnish with a sprig of mint and a cherry.',
                    heading: 'The Zombie',
                    imageAlt: '',
                    imageCaption: '',
                    imageURL: '/the-zombie-tiki-drink.jpg',
                    subheading: 'A Tiki Drink with a Twist',
                },
            ],
        },
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
        postscript: '',
        preamble:
            'Sure, here\'s an example JSON output for the "Contributor Profiles" section:',
        value: {
            itemDescription1:
                'Joe is a veteran sports journalist with over 10 years of experience covering the NFL, NBA, and MLB. He has written for several major publications and is known for his in-depth analysis and insightful commentary.',
            itemDescription2:
                'Jane is a data analyst with a background in statistics and computer science. She uses her skills to provide detailed analysis and visualizations of sports data, helping readers gain a deeper understanding of the game.',
            itemDescription3:
                'John is a sports historian with a Ph.D. in American Studies. He has written several books on the history of sports and is a frequent guest on sports talk shows, providing historical context and perspective.',
            itemSubtitle1: 'Sports Journalist',
            itemSubtitle2: 'Data Analyst',
            itemSubtitle3: 'Sports Historian',
            itemTitle1: 'Joe Smith',
            itemTitle2: 'Jane Doe',
            itemTitle3: 'John Johnson',
            sectionDescription:
                'Meet the talented team of writers, analysts, and experts who make Defector possible.',
            sectionTitle: 'Our Contributors',
        },
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
        postscript: '',
        preamble: '',
        value: {
            description:
                'At New Moon Natural Foods, we are committed to providing our community with the highest quality organic produce, locally-sourced meats, and carefully curated health and wellness products. We also offer a unique selection of beer, wine, and cheese, as well as all the best in natural grocery. Our family-owned market is dedicated to supporting local growers and artisans, while providing a welcoming and supportive environment for our customers to find the healthiest and most sustainable options for their families. Join us on your journey to a healthier way of life.',
            heading: 'New Moon Natural Foods: Your Community Market',
            subheading: 'Welcome to a Healthier Way of Life',
        },
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
        postscript: '',
        preamble: 'Here is the JSON output for the "Benefits" page:',
        value: {
            teamMemberImage1: '/images/john-doe.jpg',
            teamMemberImage2: '/images/jane-smith.jpg',
            teamMemberImage3: '/images/bob-johnson.jpg',
            teamMemberJobTitle1: 'Regional Manager',
            teamMemberJobTitle2: 'Senior Consultant',
            teamMemberName1: 'John Doe',
            teamMemberName2: 'Jane Smith',
            teamMemberName3: 'Bob Johnson',
        },
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
    expect(parseAsJSON(response).value).toEqual({
        callToAction: 'Learn More',
        heading: 'Meet the Team',
        subheading:
            'Our bakery is built on the foundation of passionate individuals who are dedicated to creating the best sourdough bread in North Lake Tahoe. Meet the team behind Masa Madre.',
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
        postscript: '',
        preamble: '',
        value: {
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
            sectionTitle: 'Meet the Team',
        },
    });
}

function unescapedDoubleQuotesTestCase() {
    let response =
        '```json\n{"heading":"The Team","subheading":"Meet the Starters","items":[{"heading":"Offense","subheading":"Quarterbacks","items":[{"heading":"1","subheading":"Jared Goff","description":"Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.","imageURL":"/players/jared-goff.jpg","imageAlt":"Jared Goff","imageCaption":"Jared Goff in action","linkURL":"/players/jared-goff"}],';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            heading: 'The Team',
            items: [
                {
                    heading: 'Offense',
                    items: [
                        {
                            description:
                                'Jared Goff is a 6\'4", 225-pound quarterback who was drafted by the Rams in the first round of the 2016 NFL Draft. He has been the starting quarterback for the Rams since his rookie season and has led the team to multiple playoff appearances.',
                            heading: '1',
                            imageAlt: 'Jared Goff',
                            imageCaption: 'Jared Goff in action',
                            imageURL: '/players/jared-goff.jpg',
                            linkURL: '/players/jared-goff',
                            subheading: 'Jared Goff',
                        },
                    ],
                    subheading: 'Quarterbacks',
                },
            ],
            subheading: 'Meet the Starters',
        },
    });

    response =
        '```json\n{"items":[{"heading":"Our History","description":"Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.","imageURL":"/something-awful-history.jpg","imageAlt":"Something Awful Founder Richard \'Lowtax\' Kyanka"}]}\n```';

    expect(parseAsJSON(response)).toEqual({
        postscript: '',
        preamble: '',
        value: {
            items: [
                {
                    description:
                        'Something Awful was founded in 1999 by Richard "Lowtax" Kyanka, who started the website as a humble message board for fans of video games. Over the years, it has grown into a popular comedy website, featuring blog entries, forums, feature articles, digitally edited pictures, and humorous media reviews. Today, Something Awful continues to be a hub for fans of all things geeky, providing them with a unique blend of humor and community.',
                    heading: 'Our History',
                    imageAlt: "Something Awful Founder Richard 'Lowtax' Kyanka",
                    imageURL: '/something-awful-history.jpg',
                },
            ],
        },
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
        postscript: '',
        preamble:
            'Sure, here\'s an example JSON output for the "Services" section based on the provided information:',
        value: {
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
        },
    });
}
