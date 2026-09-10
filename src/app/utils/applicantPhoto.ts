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

    // 1. Artifacts, creative works, and non-profile introductions:
    // E.g.: "Provide a personal artifact to help introduce yourself to your future PGN Brothers.
    // It can be a photo, short story, poem, portfolio, song, or anything else you would like."
    // These are creative or personal artifacts, NOT the candidate's professional profile picture.
    const isArtifact =
      /artifact|portfolio|poem|song|story|creative|artwork|drawing|screenshot|audio|music/i.test(combined) ||
      (/introduce\s*yourself/i.test(combined) && /artifact|photo|story|poem|song|portfolio/i.test(combined));

    // 2. Explicit professional indicators:
    const isProfessional = /professional|formal|business|official/i.test(combined);

    // 3. Headshot / portrait / profile picture indicators:
    const hasHeadshot = /head\s*shot/i.test(combined);
    const hasPortrait = /portrait/i.test(combined);
    const hasProfilePic = /profile\s*(photo|picture|pic|image)/i.test(combined);

    // 4. Photo / picture words:
    const hasPhotoWord = /photo|picture|portrait|head\s*shot|image|pic\b/i.test(combined);

    // 5. Phrases explicitly requesting a photo of the applicant:
    // Note: "picture of yourself" is a standard prompt for a headshot/profile picture, NOT an artifact.
    const isPhotoOfSelf =
      /(photo|picture|image|portrait|headshot)\s*(of|for)\s*(yourself|you)\b/i.test(combined) ||
      /(upload|provide|submit)\s*(a|your)?\s*(professional\s*)?(photo|picture|image|headshot|portrait)\b/i.test(combined);

    // 6. Casual / informal personal picture (e.g. "casual photo", "fun photo"):
    const isCasualOrFun = /casual\s*(photo|picture|pic)|fun\s*(photo|picture|pic)|favorite\s*(photo|pic)|hobby/i.test(combined);

    const isExplicitImg =
      strVal.startsWith("data:image/") ||
      strVal.startsWith("/uploads/photo_") ||
      /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(strVal);

    let score = 0;

    if (isArtifact) {
      // Personal artifacts (stories, poems, creative artifacts, songs, etc.)
      // should never be used as the applicant's profile picture avatar.
      score = 0;
    } else if (isProfessional && (hasHeadshot || hasProfilePic || hasPhotoWord || isPhotoOfSelf)) {
      // Top Tier: "Please upload a professional picture of yourself", "Professional headshot", "Professional photo"
      score = 150;
    } else if (hasHeadshot || hasProfilePic) {
      // Tier 2: "Headshot", "Profile picture"
      score = 120;
    } else if (hasPortrait) {
      // Tier 3: "Portrait"
      score = 100;
    } else if (isPhotoOfSelf && !isCasualOrFun) {
      // Tier 4: "Please upload a picture of yourself" (without the word 'professional')
      score = 90;
    } else if (hasPhotoWord && !isCasualOrFun) {
      // Tier 5: Generic "Photo", "Picture"
      score = 70;
    } else if (isExplicitImg && !isCasualOrFun) {
      // Tier 6: Unlabeled image file upload
      score = 40;
    } else if (isCasualOrFun) {
      // Tier 7: Explicitly casual/fun picture (only fallback if no professional/headshot exists)
      score = 10;
    } else {
      score = 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPhoto = strVal;
    }
  }

  // Fallback to direct keys if not picked up above with a high-confidence score
  if (!bestPhoto || bestScore < 70) {
    const directHeadshot = parsedAnswers.headshot || parsedAnswers.photo_headshot || parsedAnswers.professional_headshot;
    if (typeof directHeadshot === "string" && isCandidateImageUrl(directHeadshot)) {
      return directHeadshot.trim();
    }
  }

  if (!bestPhoto || bestScore < 40) {
    const directFallback = parsedAnswers.photo || parsedAnswers.photo_url || parsedAnswers.picture;
    if (typeof directFallback === "string" && isCandidateImageUrl(directFallback)) {
      return directFallback.trim();
    }
  }

  // If the only matched item was an artifact (score <= 0), don't return it as a profile picture
  if (bestScore <= 0) {
    return "";
  }

  return bestPhoto;
}
