// Type definitions
export interface SelfHostedApp {
  name: string;
  description: string;
  url: string;
  sourceCode?: string;
  demo?: string;
  license: string;
  language?: string;
  category: string;
  subcategory?: string;
}

export interface ParsedCategory {
  name: string;
  description: string;
  apps: SelfHostedApp[];
}

export class GitHubService {
  private readonly RAW_URL = 'https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md';
  private readonly CACHE_KEY = 'awesome-selfhosted-data';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  async fetchAwesomeSelfHosted(): Promise<ParsedCategory[]> {
    try {
      // Check cache first
      const cached = this.getCachedData();
      if (cached) {
        console.log('Using cached data');
        return cached;
      }

      console.log('🌐 Fetching fresh data from:', this.RAW_URL);
      const response = await fetch(this.RAW_URL);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log('📄 Content length:', content.length);
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      
      const result = this.parseMarkdown(content);
      console.log('Parsed categories:', result.length);
      console.log('Total apps found:', result.reduce((sum, cat) => sum + cat.apps.length, 0));
      
      // Cache the result
      this.setCachedData(result);
      
      return result;
    } catch (error) {
      console.error('Error fetching awesome-selfhosted data:', error);
      throw error;
    }
  }

  private parseMarkdown(content: string): ParsedCategory[] {
    const categories: ParsedCategory[] = [];
    const lines = content.split('\n');
    
    let currentCategory: ParsedCategory | null = null;
    let inSoftwareSection = false;
    
    console.log('🔍 Starting to parse markdown, total lines:', lines.length);
    
    // Log first 50 lines to see structure
    console.log('📄 First 50 lines:');
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      console.log(`${i}: ${lines[i]}`);
    }
    
    // Look for any ## headers
    const headers = lines.filter((line) => line.startsWith('## ')).slice(0, 10);
    console.log('📋 Found headers:', headers);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Start parsing after "Software" section
      if (line === '## Software') {
        console.log('📍 Found Software section at line:', i);
        inSoftwareSection = true;
        continue;
      }
      
      if (!inSoftwareSection) continue;
      
      // Stop at next major section
      if (line.startsWith('## ') && line !== '## Software') {
        break;
      }
      
      // Category headers (### only)
      if (line.startsWith('### ')) {
        if (currentCategory && currentCategory.apps.length > 0) {
          categories.push(currentCategory);
        }
        
        const categoryName = line.replace(/^###\s+/, '').replace(/\s+\^.*$/, '').trim();
        if (categoryName && !categoryName.includes('back to top')) {
          // Check if this is a subcategory (contains ' - ')
          if (categoryName.includes(' - ')) {
            currentCategory = {
              name: categoryName, // Keep full name for dropdown display
              description: '',
              apps: []
            };
            console.log('📂 Found subcategory:', categoryName);
          } else {
            currentCategory = {
              name: categoryName,
              description: '',
              apps: []
            };
            console.log('📂 Found category:', categoryName);
          }
          
          // Get description from next line if it exists
          if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].startsWith('#') && !lines[i + 1].startsWith('-')) {
            currentCategory.description = lines[i + 1].trim();
          }
        }
        continue;
      }
      
      // Parse app entries (must start with "- [")
      if (currentCategory && line.startsWith('- [')) {
        const app = this.parseAppLine(line, currentCategory.name);
        if (app) {
          currentCategory.apps.push(app);
          console.log('📱 Found app:', app.name, 'in category:', currentCategory.name);
        }
      }
    }
    
    // Add the last category
    if (currentCategory && currentCategory.apps.length > 0) {
      categories.push(currentCategory);
    }
    
    return categories.filter(cat => cat.apps.length > 0);
  }

  private getCachedData(): ParsedCategory[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (within 24 hours)
      if (now - timestamp < this.CACHE_DURATION) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    }
  }

  private setCachedData(data: ParsedCategory[]): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  private parseAppLine(line: string, category: string): SelfHostedApp | null {
    try {
      // Match pattern: - [Name](url) - Description. ([Demo](url), [Source Code](url)) `License` `Language`
      const appMatch = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)\s*-\s*(.+)/);
      if (!appMatch) {
        console.warn('Failed to match app pattern:', line);
        return null;
      }
      
      const name = appMatch[1].trim();
      const url = appMatch[2].trim();
      const restOfLine = appMatch[3].trim();
      
      // Extract description (everything before first parenthesis or backtick)
      const descMatch = restOfLine.match(/^([^(`]+)/);
      const description = descMatch ? descMatch[1].trim().replace(/\.$/, '') : '';
      
      // Extract links
      const demoMatch = line.match(/\[(?:Live Demo|Demo)\]\(([^)]+)\)/i);
      const sourceMatch = line.match(/\[Source Code\]\(([^)]+)\)/i);
      
      // Extract license and language (backticks)
      const backtickMatches = line.match(/`([^`]+)`/g);
      let license = 'Unknown';
      let language = undefined;
      
      if (backtickMatches) {
        // First backtick is usually license
        if (backtickMatches[0]) {
          license = backtickMatches[0].replace(/`/g, '');
        }
        // Second backtick is usually language/tech stack
        if (backtickMatches[1]) {
          language = backtickMatches[1].replace(/`/g, '');
        }
      }
      
      const subcategory = category.includes(' - ') ? category.split(' - ', 2)[1] : undefined;

      return {
        name,
        description,
        url,
        sourceCode: sourceMatch ? sourceMatch[1] : undefined,
        demo: demoMatch ? demoMatch[1] : undefined,
        license,
        language,
        category,
        subcategory
      };
    } catch (error) {
      console.warn('Failed to parse app line:', line, error);
      return null;
    }
  }
}

export const githubService = new GitHubService();
