# @acusti/parsing

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)

`@acusti/parsing` exports `parseAsJSON`, a function that takes a string and
attempts to parse it as JSON. It returns `{ preamble, value, postscript }`:
`value` is the resulting JS value, or `null` if the string defeated all
attempts at parsing it, and `preamble` and `postscript` are the text that
came before and after the JSON (each an empty string if there was none).
This is especially useful for generative AI when you prompt an LLM to
generate a response in JSON: `parseAsJSON` identifies any preamble and
postscript and separates them from the JSON data, and it can successfully
and usefully parse an incomplete response as it streams in (see
[Reading a response as it streams in](#reading-a-response-as-it-streams-in)).

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
const { preamble, value } =
    parseAsJSON(`  Sure, here's an example of a JSON response for the "Contact Form" page:
{
    "heading": "Get in Touch",
    "form": {
        "email": "info@example.net",
        "message": "Please enter your message or inquiry below"
    }
`);
/* value is:
{
    heading: 'Get in Touch',
    form: {
        email: 'info@example.net',
        message: 'Please enter your message or inquiry below',
    },
}
and preamble is:
'Sure, here\'s an example of a JSON response for the "Contact Form" page:'
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
`).value;
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
| miniBlogPostLede2 | "Vytas' Hatha Yoga classes offer a sense of community and connection" | |`)
    .value;
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
).value;
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

## Reading a response as it streams in

You can call `parseAsJSON` repeatedly on text as it streams in to support
UIs that show the response incrementally as it builds out. A text that is
JSON as far as it goes is read as far as it goes, and each reading is a
prefix of the finished value: what the text can’t yet be sure of is left
out, so a reading holds nothing that the finished one won’t. A text that
needs repairs is read as well as the repairs allow, which need not be a
prefix of what it goes on to read as.

- A string is read up to where it stops (less an escape sequence that the
  text ends partway through).
- A key, or a `true`, `false`, `null` or number, that the text ends partway
  through is left out until it is whole.
- A number that the text ends on is left out too, because more of it may be
  coming: `"rating": 4` could become `4.5` or `45`. It is read once a
  comma, a closing bracket or whitespace follows it.

The one placeholder is for a key that is whole but has no value yet, which
holds `''` until its value starts.

```js
parseAsJSON('{"heading": "Our Story", "rating": 4').value;
// { heading: 'Our Story' }

parseAsJSON('{"heading": "Our Story", "rating": 4.5, "isLive": tr').value;
// { heading: 'Our Story', rating: 4.5 }

parseAsJSON('{"heading": "Our Story", "items": [{"name": "A ta').value;
// { heading: 'Our Story', items: [{ name: 'A ta' }] }

parseAsJSON('{"heading": "Our Story", "subheading":').value;
// { heading: 'Our Story', subheading: '' }
```

`parseAsJSON` can’t tell a text that is still arriving from one that
finished without its closing brackets. If you know that a text is complete,
with nothing cut off its end, add a line break to it (any whitespace will
do) to say so, and a number that it ends on is read:

```js
parseAsJSON('{"count": 12').value;
// {}

parseAsJSON('{"count": 12' + '\n').value;
// { count: 12 }
```

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
