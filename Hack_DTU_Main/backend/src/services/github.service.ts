import axios from 'axios';

export class GithubService {
    private static GITHUB_API_URL = 'https://api.github.com';
    private static GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

    static extractUsername(githubUrl: string): string | null {
        try {
            const url = new URL(githubUrl);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (url.hostname.includes('github.com') && pathParts.length > 0) {
                return pathParts[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    static async fetchUserDetails(username: string) {
        const headers: any = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        try {
            // 1. Fetch Basic Info
            const userResponse = await axios.get(`${this.GITHUB_API_URL}/users/${username}`, { headers });
            const userData = userResponse.data;

            // 2. Fetch Pinned Repos and Contribution Data via GraphQL
            const graphqlQuery = {
                query: `
                {
                  user(login: "${username}") {
                    contributionsCollection {
                      contributionCalendar {
                        totalContributions
                      }
                    }
                    pinnedItems(first: 6, types: REPOSITORY) {
                      nodes {
                        ... on Repository {
                          name
                          url
                          description
                          primaryLanguage {
                            name
                          }
                          object(expression: "HEAD:README.md") {
                            ... on Blob {
                              text
                            }
                          }
                        }
                      }
                    }
                  }
                }`
            };

            let contributions = 0;
            let pinnedProjects = [];

            try {
                const gqlResponse = await axios.post(this.GITHUB_GRAPHQL_URL, graphqlQuery, { headers });
                const gqlData = gqlResponse.data?.data?.user;
                
                if (gqlData) {
                    contributions = gqlData.contributionsCollection?.contributionCalendar?.totalContributions || 0;
                    
                    const items = gqlData.pinnedItems?.nodes || [];
                    pinnedProjects = items.map((repo: any) => ({
                        name: repo.name,
                        url: repo.url,
                        description: repo.description || "",
                        languages: repo.primaryLanguage ? [repo.primaryLanguage.name] : [],
                        readmeTex: repo.object?.text ? repo.object.text.substring(0, 5000) : null // limit to 5000 chars
                    }));
                }
            } catch (gqlErr) {
                console.error("GraphQL GitHub Error:", gqlErr);
            }

            // 3. Fetch Top Languages (from recent public repos if needed, but we can do a simple REST heuristic)
            const reposResponse = await axios.get(`${this.GITHUB_API_URL}/users/${username}/repos?sort=updated&per_page=10`, { headers });
            const languageCounts: { [key: string]: number } = {};
            
            reposResponse.data.forEach((repo: any) => {
                if (repo.language) {
                    languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
                }
            });

            const topLanguages = Object.entries(languageCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([lang]) => lang);

            // Also calculate exact percentages for the donut chart based on repo sizes or counts
            // For a better donut chart, let's include language distribution objects
            const totalLangCount = Object.values(languageCounts).reduce((a, b) => a + b, 0);
            const languageDistribution = Object.entries(languageCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([name, count]) => ({
                    name,
                    value: Math.round((count / totalLangCount) * 100)
                }));


            return {
                repoCount: userData.public_repos,
                followers: userData.followers,
                contributions,
                topLanguages,
                languageDistribution, // e.g., [{ name: 'TypeScript', value: 60 }]
                pinnedProjects
            };

        } catch (error) {
            console.error(`Failed to fetch GitHub data for ${username}:`, error);
            return null;
        }
    }
}
