import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Play } from 'lucide-react';
import type { SelfHostedApp } from '@/services/github';

interface AppCardProps {
  app: SelfHostedApp;
}

function isRepoHost(host: string): boolean {
  const repos = new Set([
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'codeberg.org',
    'sourceforge.net',
    'gitea.com',
    'gitee.com',
  ]);
  return repos.has(host.toLowerCase());
}

function getHostname(url: string): string | null {
  try { return new URL(url).hostname; } catch { return null; }
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = '';
    url.search = '';
    // remove trailing slash
    url.pathname = url.pathname.replace(/\/$/, '');
    return url.toString();
  } catch {
    return u.replace(/\/$/, '');
  }
}

export function AppCard({ app }: AppCardProps) {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getWebsiteIcon = (url: string) => {
    if (url.includes('github.com')) {
      return Github;
    }
    return ExternalLink;
  };

  const getWebsiteTitle = (url: string) => {
    if (url.includes('github.com')) {
      return 'View on GitHub';
    }
    return 'Visit Website';
  };

  const demoUrl = app.demo || '';
  const websiteUrl = app.url || '';
  const sourceUrl = app.sourceCode || '';

  const demoHost = demoUrl ? getHostname(demoUrl) : null;
  const websiteHost = websiteUrl ? getHostname(websiteUrl) : null;

  const showDemo = !!demoUrl && !(demoHost && isRepoHost(demoHost));
  const isWebsiteSameAsSource = !!websiteUrl && !!sourceUrl && normalizeUrl(websiteUrl) === normalizeUrl(sourceUrl);
  const websiteIsRepo = websiteHost ? isRepoHost(websiteHost) : false;
  const hideWebsiteBecauseDuplicate = !!sourceUrl && (isWebsiteSameAsSource || (websiteIsRepo && getHostname(sourceUrl) === 'github.com'));

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200 border-border/50 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground truncate">
              {app.name}
            </CardTitle>

          </div>
          <div className="flex gap-1 flex-shrink-0">
            {showDemo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLinkClick(demoUrl)}
                title="View Live Demo"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {app.sourceCode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLinkClick(sourceUrl)}
                title="View Source Code"
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
            {websiteUrl && !hideWebsiteBecauseDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleLinkClick(websiteUrl)}
                title={getWebsiteTitle(websiteUrl)}
              >
                {React.createElement(getWebsiteIcon(websiteUrl), { className: "h-4 w-4" })}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-3">
          {app.description}
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-auto">
          <Badge variant="outline" className="text-xs">
            {app.license}
          </Badge>
          {app.language && (
            <Badge variant="outline" className="text-xs">
              {app.language}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
