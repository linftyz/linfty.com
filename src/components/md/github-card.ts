import type { GitHubRepoSnapshot } from "@/types";
import {
  createRequestMemoryCache,
  hasResolvedValue,
  readPendingRequest,
  readResolvedValue,
  readSessionStorageCache,
  trackPendingRequest,
  writeResolvedValue,
  writeSessionStorageCache,
} from "@/utils/card-cache";

interface GitHubRepoApiResponse {
  owner?: {
    avatar_url?: string | null;
  } | null;
  description?: string | null;
  stargazers_count?: number | null;
  forks_count?: number | null;
  license?: {
    spdx_id?: string | null;
  } | null;
}

const githubCardNumber = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const GITHUB_CARD_CACHE_NAMESPACE = "github-card";
const GITHUB_CARD_CACHE_TTL = 1000 * 60 * 30;
const pendingRepoRequests = createRequestMemoryCache<GitHubRepoSnapshot>();

function setText(
  card: ParentNode,
  selector: string,
  value: string | undefined | null,
): void {
  const node = card.querySelector(selector);
  if (node instanceof HTMLElement && value) {
    node.textContent = value;
  }
}

function formatCount(
  value: number | null | undefined,
  fallback: string | undefined,
): string {
  if (typeof value === "number") {
    return githubCardNumber.format(value);
  }

  return fallback || "--";
}

function paintFallback(card: HTMLElement): void {
  setText(
    card,
    ".github-card-description",
    card.dataset.fallbackDescription || "暂时无法获取仓库信息",
  );
  setText(card, ".github-card-stars", card.dataset.fallbackStars || "--");
  setText(card, ".github-card-forks", card.dataset.fallbackForks || "--");
  setText(card, ".github-card-license", card.dataset.fallbackLicense || "--");
}

function paintSnapshot(card: HTMLElement, snapshot: GitHubRepoSnapshot): void {
  const avatar = card.querySelector(".github-card-avatar img");
  if (avatar instanceof HTMLImageElement && snapshot.avatar) {
    avatar.src = snapshot.avatar;
  }

  setText(
    card,
    ".github-card-description",
    snapshot.description || card.dataset.fallbackDescription || "暂无描述",
  );
  setText(
    card,
    ".github-card-stars",
    formatCount(snapshot.stars, card.dataset.fallbackStars),
  );
  setText(
    card,
    ".github-card-forks",
    formatCount(snapshot.forks, card.dataset.fallbackForks),
  );
  setText(
    card,
    ".github-card-license",
    snapshot.license || card.dataset.fallbackLicense || "No License",
  );
}

async function fetchRepoSnapshot(
  repo: string,
): Promise<GitHubRepoSnapshot | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as GitHubRepoApiResponse;

    return {
      avatar: data.owner?.avatar_url || "",
      description: data.description || "",
      stars: data.stargazers_count ?? null,
      forks: data.forks_count ?? null,
      license: data.license?.spdx_id || "",
    };
  } catch (error) {
    console.warn(`[GitHubCard] ${repo}`, error);
    return null;
  }
}

async function requestRepoSnapshot(
  repo: string,
): Promise<GitHubRepoSnapshot | null> {
  const cachedSnapshot = readSessionStorageCache<GitHubRepoSnapshot>(
    GITHUB_CARD_CACHE_NAMESPACE,
    repo,
  );
  if (cachedSnapshot) {
    return writeResolvedValue(pendingRepoRequests, repo, cachedSnapshot);
  }

  if (hasResolvedValue(pendingRepoRequests, repo)) {
    return readResolvedValue(pendingRepoRequests, repo) ?? null;
  }

  const pendingRequest = readPendingRequest(pendingRepoRequests, repo);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetchRepoSnapshot(repo).then((snapshot) => {
    writeResolvedValue(pendingRepoRequests, repo, snapshot);

    if (snapshot) {
      writeSessionStorageCache(
        GITHUB_CARD_CACHE_NAMESPACE,
        repo,
        snapshot,
        GITHUB_CARD_CACHE_TTL,
      );
    }

    return snapshot;
  });

  return trackPendingRequest(pendingRepoRequests, repo, request);
}

async function mountGitHubCard(card: HTMLElement): Promise<void> {
  if (card.dataset.githubCardReady === "true") {
    return;
  }

  card.dataset.githubCardReady = "true";

  const repo = card.dataset.repo;
  if (!repo) {
    paintFallback(card);
    return;
  }

  const snapshot = await requestRepoSnapshot(repo);
  if (!snapshot) {
    paintFallback(card);
    return;
  }

  paintSnapshot(card, snapshot);
}

export function initGitHubCards(): void {
  document.querySelectorAll(".github-card[data-repo]").forEach((card) => {
    if (card instanceof HTMLElement) {
      void mountGitHubCard(card);
    }
  });
}
