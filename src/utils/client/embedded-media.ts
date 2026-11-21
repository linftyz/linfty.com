import { createRepositoryLoader } from "./github-repository.mjs";

const loadRepository = createRepositoryLoader();
const numbers = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
let observer: IntersectionObserver | undefined;

function setText(card: HTMLElement, field: string, value: string) {
  const target = card.querySelector<HTMLElement>(`[data-github-${field}]`);
  if (target) target.textContent = value;
}

async function enhance(card: HTMLElement) {
  if (card.dataset.githubState) return;
  card.dataset.githubState = "loading";
  try {
    const data = await loadRepository(card.dataset.githubRepo || "");
    if (data.description) setText(card, "description", data.description);
    setText(card, "star", `${numbers.format(data.stars)}`);
    setText(card, "fork", `${numbers.format(data.forks)}`);
    setText(card, "license", data.license);
    card.dataset.githubState = "ready";
  } catch {
    card.dataset.githubState = "error";
    const status = card.querySelector<HTMLElement>("[data-github-status]");
    if (status) {
      status.textContent = "仓库信息暂不可用，可点击查看原页面。";
      status.hidden = false;
    }
  }
}

function initialize() {
  observer?.disconnect();
  // A broken remote thumbnail should leave a readable text card, not a broken-image icon.
  document
    .querySelectorAll<HTMLImageElement>("img[data-embedded-media]")
    .forEach((image) => {
      if (image.complete && !image.naturalWidth) image.hidden = true;
      image.addEventListener(
        "error",
        () => {
          image.hidden = true;
        },
        { once: true },
      );
    });
  const cards = document.querySelectorAll<HTMLElement>(
    "[data-github-repo]:not([data-github-state])",
  );
  if (!cards.length) return;
  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => void enhance(card));
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer?.unobserve(entry.target);
          void enhance(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: "150px" },
  );
  cards.forEach((card) => observer?.observe(card));
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
document.addEventListener("astro:page-load", initialize);
document.addEventListener("astro:before-swap", () => observer?.disconnect());
