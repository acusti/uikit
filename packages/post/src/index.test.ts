import { describe, expect, it } from 'vitest';

import { post } from './index.js';

// To find open GraphQL APIs for testing:
// https://www.apollographql.com/blog/community/backend/8-free-to-use-graphql-apis-for-your-projects-and-demos/
const URL = 'https://countries.trevorblades.com/graphql';

describe('post', () => {
    it('performs a POST request to a GraphQL API for a List query and returns the response as JSON', async () => {
        const result = await post<{
            data?: {
                countries: Array<{ capital: string; emoji: string; name: string }>;
            };
            errors?: Array<{ message: string }>;
        }>(URL, {
            query: `query {
              countries {
                name
                capital
                emoji
              }
            }`,
        });

        const first = result.data!.countries[0];
        expect(first.name.length).toBeGreaterThan(1);
        expect(first.capital.length).toBeGreaterThan(1);
        expect(first.emoji).toBeTruthy();
    });

    it('performs a POST request to a GraphQL API for a Get query and returns the response as JSON', async () => {
        const result = await post<{
            data?: {
                country: {
                    languages: Array<{
                        code: string;
                        name: string;
                    }>;
                    name: string;
                    native: string;
                };
            };
            errors?: Array<{ message: string }>;
        }>(URL, {
            query: `query {
              country(code: "MX") {
                name
                native
                languages {
                  code
                  name
                }
              }
            }`,
        });

        const country = result.data!.country;
        expect(country.name).toBe('Mexico');
        expect(country.native).toBe('México');
        expect(country.languages[0].code).toBe('es');
    });
});
