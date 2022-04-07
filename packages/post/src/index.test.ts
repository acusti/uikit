import { post } from './index.js';

describe('post', () => {
    it('performs a POST request to a GraphQL API for a List query and returns the response as JSON', async () => {
        const url = 'https://swapi-graphql.netlify.app/.netlify/functions/index';
        const result = await post<{
            data?: {
                allFIlms: {
                    edges: Array<{ director: string; episodeID: string; title: string }>;
                };
            };
            errors?: Array<{ message: string }>;
        }>(url, {
            query: `query Query {
              allFilms {
                edges {
                  node {
                    director
                    episodeID
                    title
                  }
                }
              }
            }`,
        });

        const firstFilm = result.data?.allFilms.edges[0].node || {};
        expect(firstFilm.title).toBeTruthy();
        expect(firstFilm.episodeID).toBeTruthy();
        expect(firstFilm.director).toBeTruthy();
    });

    it('performs a POST request to a GraphQL API for a Get query and returns the response as JSON', async () => {
        const url = 'https://countries.trevorblades.com/graphql';
        const result = await post<{
            data?: {
                country: {
                    name: string;
                    native: string;
                    languages: Array<{
                        code: string;
                        name: string;
                    }>;
                };
            };
            errors?: Array<{ message: string }>;
        }>(url, {
            query: `query Query {
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

        const country = (result as any).data.country;
        expect(country.name).toBe('Mexico');
        expect(country.native).toBe('México');
        expect(country.languages[0].code).toBe('es');
    });
});

// Default content-type? i.e. content-type: application/json; charset=UTF-8?
