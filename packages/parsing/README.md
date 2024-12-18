# @acusti/parsing

[![latest version](https://img.shields.io/npm/v/@acusti/parsing?style=for-the-badge)](https://www.npmjs.com/package/@acusti/parsing)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/parsing?style=for-the-badge)](https://bundlephobia.com/package/@acusti/parsing)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/parsing?style=for-the-badge)](https://www.npmjs.com/package/@acusti/parsing)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@acusti/parsing/0.15.0)](https://socket.dev/npm/package/@acusti/parsing/overview/0.15.0)

`@acusti/parsing` exports `parseAsJSON`, a function that takes a string and
attempts to parse it as JSON, returning the resulting JS value, or `null`
if the string defeated all attempts at parsing it. This is especially
useful for generative AI when you prompt an LLM to generate a response in
JSON, because most models are unable to consistently generate valid JSON,
and even when they do, will often have a pre- or post-amble as a part of
the response.

The [unit tests][] show the kinds of LLM responses and syntax errors that
the package can fix and convert into a valid result.

## Usage

```
npm install @acusti/parsing
# or
yarn add @acusti/parsing
```

Import `parseAsJSON` (it’s a named export) and pass a string to it:

````js
import { parseAsJSON } from '@acusti/parsing';

// it might neglect to close the outer curly braces
parseAsJSON(`  Sure, here's an example of a JSON response for the "Contact Form" page:
{
    "heading": "Get in Touch",
    "form": {
        "email": "info@example.net",
        "message": "Please enter your message or inquiry below"
    }
`);
/* results in:
{
    heading: 'Get in Touch',
    form: {
        email: 'info@example.net',
        message: 'Please enter your message or inquiry below',
    },
}
*/

// you might get a "key": "value" list with no syntax around it
parseAsJSON(` Here are the props for the "Blog" page:
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
`);
/* results in:
{
    blogPostImage1: '/images/blog-post-image1.jpg',
    blogPostSubheading1: 'Exploring the Art of Sourdough Baking',
    blogPostHeading1: 'The Magic of Sourdough',
    blogPostLede1: "At Masa Madre, we're passionate about creating the perfect sourdough bread. Learn more about the art and craft of this ancient tradition.",
    blogPostImage2: '/images/blog-post-image2.jpg',
    blogPostSubheading2: 'From Seed to Loaf',
    blogPostHeading2: 'Our Journey to Your Table',
    blogPostLede2: 'Discover the journey of our sourdough bread, from the seed to the loaf.',
    blogPostImage3: '/images/blog-post-image3.jpg',
    blogPostSubheading3: 'Sourdough 101',
    blogPostHeading3: 'Learn the Basics of Artisanal Bread Making',
    blogPostLede3: "Get started on your sourdough journey with our beginner's guide to artisanal bread making.",
}
*/

// in case llama 2 decides to give you a markdown table to represent the JSON
parseAsJSON(`Here are the props for Vytas' Hatha Yoga classes:
Props:
| Prop Name | Value |
| blogPostImage1 | /vytas-yoga-class-background.jpg |
| shortBlogPostCaption1 | "Find inner peace and balance through physical postures and breathing techniques" |
| blogPostHeading1 | "Hatha Yoga Classes with Vytas" |
| miniBlogPostLede1 | "Discover the transformative power of Hatha Yoga with Vytas, a seasoned yoga teacher" |
| blogPostImage2 | /vytas-yoga-community-background.jpg |
| shortBlogPostCaption2 | "Join a supportive community of like-minded individuals and deepen your practice with Vytas" |
| blogPostHeading2 | "Community and Connection" |
| miniBlogPostLede2 | "Vytas' Hatha Yoga classes offer a sense of community and connection" | |`);
/* results in:
{
    'Prop Name': 'Value',
    blogPostImage1: '/vytas-yoga-class-background.jpg',
    shortBlogPostCaption1: 'Find inner peace and balance through physical postures and breathing techniques',
    blogPostHeading1: 'Hatha Yoga Classes with Vytas',
    miniBlogPostLede1: 'Discover the transformative power of Hatha Yoga with Vytas, a seasoned yoga teacher',
    blogPostImage2: '/vytas-yoga-community-background.jpg',
    shortBlogPostCaption2: 'Join a supportive community of like-minded individuals and deepen your practice with Vytas',
    blogPostHeading2: 'Community and Connection',
    miniBlogPostLede2: "Vytas' Hatha Yoga classes offer a sense of community and connection",
}
*/

// it might prematurely close the outer JSON object even though the content continues
parseAsJSON(
    '```json\n{"heading":"Organic Produce","subheading":"The Benefits of Going Organic","description":"Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers."},"items":[{"heading":"Organic Fruits","subheading":"Nature\'s Sweet Treats"},{"heading":"Organic Vegetables","subheading":"Fresh from the Garden"}]}\n```',
);
/* results in:
{
    heading: 'Organic Produce',
    subheading: 'The Benefits of Going Organic',
    description: 'Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers.',
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
}
*/
````

Again, there are more examples of the kinds of things that the parser can
handle in the [unit tests][].

Also, if you’re wondering the best way to get an LLM to return JSON, I
found the few-shot prompting approach suggested in Pinecone’s [Llama 2: AI
Developers Handbook][] helpful with a variety of different models (Llama 2
7B, OpenChat 3.5, OpenHermes 2.5, Zephyr 7B).

[unit tests]:
    https://github.com/acusti/uikit/blob/main/packages/parsing/src/parse-as-json.test.ts
[llama 2: ai developers handbook]:
    https://www.pinecone.io/learn/llama-2/#Llama-2-Chat-Prompt-Structure
