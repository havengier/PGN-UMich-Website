/**
 * Checks if a string value looks like an image URL or data URI.
 */
export function isCandidateImageUrl(val: unknown): boolean {
  if (!val || typeof val !== "string") return false;
  const s = val.trim();
  if (s.startsWith("data:image/")) return true;
  if (s.startsWith("/uploads/photo_")) return true;
  if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(s)) return true;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/uploads/")) {
    const isDoc = /\.(pdf|docx?|doc|txt|xlsx?|pptx?|csv)(\?.*)?$/i.test(s) || s.includes("resume_");
    return !isDoc;
  }
  return false;
}

/**
 * Resolves the primary profile picture (headshot) for an applicant from their submitted answers.
 * When multiple images are uploaded (e.g. personal photo vs professional headshot),
 * questions explicitly asking for a headshot are prioritized over personal or generic photos.
 */
export function resolveApplicantPhoto(
  answers: Record<string, any> = {},
  questionLabels: Record<string, string> = {},
): string {
  let parsedAnswers: Record<string, any> = answers;
  if (typeof answers === "string") {
    try {
      parsedAnswers = JSON.parse(answers);
    } catch {
      return "";
    }
  }

  if (!parsedAnswers || typeof parsedAnswers !== "object") {
    return "";
  }

  let bestPhoto = "";
  let bestScore = -1;

  for (const [key, val] of Object.entries(parsedAnswers)) {
    if (!val) continue;
    const strVal = typeof val === "string" ? val.trim() : "";
    if (!strVal || !isCandidateImageUrl(strVal)) continue;

    const label = (questionLabels[key] || "").toLowerCase();
    const keyLower = key.toLowerCase();
    const combined = `${label} ${keyLower}`.trim();

    const hasHeadshot = /head\s*shot/i.test(combined);
    const isPersonal = /personal|meaningful|favorite|casual|fun|hobby|about\s*you|yourself|story/i.test(combined);
    const isProfessional = /professional|formal|business|profile|official/i.test(combined);
    const hasPhotoWord = /photo|picture|portrait|image/i.test(combined);
    const isExplicitImg =
      strVal.startsWith("data:image/") ||
      strVal.startsWith("/uploads/photo_") ||
      /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(strVal);

    let score = 0;
    if (hasHeadshot && isProfessional) {
      score = 120; // Explicit professional headshot
    } else if (hasHeadshot && !isPersonal) {
      score = 100; // Question specifically asking for headshot
    } else if (hasHeadshot) {
      score = 90; // Mentions headshot
    } else if (isProfessional && (hasPhotoWord || isExplicitImg) && !isPersonal) {
      score = 80; // Professional photo / portrait
    } else if (/portrait/i.test(combined) && !isPersonal) {
      score = 70; // Portrait
    } else if (hasPhotoWord && !isPersonal) {
      score = 50; // Generic photo/picture (not personal)
    } else if (!isPersonal && isExplicitImg) {
      score = 30; // Unlabeled image file
    } else if (isPersonal && (hasPhotoWord || isExplicitImg)) {
      score = 10; // Explicit personal picture (fallback if no headshot uploaded)
    } else {
      score = 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPhoto = strVal;
    }
  }

  // Check direct keys if no explicit headshot was matched in the questions
  if (!bestPhoto || bestScore < 70) {
    const directHeadshot = parsedAnswers.headshot || parsedAnswers.photo_headshot || parsedAnswers.professional_headshot;
    if (typeof directHeadshot === "string" && isCandidateImageUrl(directHeadshot)) {
      return directHeadshot.trim();
    }
  }

  if (!bestPhoto) {
    const directFallback = parsedAnswers.photo || parsedAnswers.photo_url || parsedAnswers.picture;
    if (typeof directFallback === "string" && isCandidateImageUrl(directFallback)) {
      return directFallback.trim();
    }
  }

  return bestPhoto;
}
