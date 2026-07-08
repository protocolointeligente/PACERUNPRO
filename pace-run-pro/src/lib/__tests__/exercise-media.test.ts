import { describe, expect, it } from "vitest";
import { resolveExerciseMedia } from "../exercise-media";

describe("resolveExerciseMedia", () => {
  it("prioriza o vídeo do banco quando existe", () => {
    const media = resolveExerciseMedia({
      imageUrl: "https://example.com/image.jpg",
      videos: [{ url: "https://drive.google.com/file/d/abc123/view" }],
    });

    expect(media.kind).toBe("video");
    expect(media.url).toContain("drive.google.com/uc");
    expect(media.url).toContain("abc123");
  });

  it("usa a imagem quando não existe vídeo", () => {
    const media = resolveExerciseMedia({
      imageUrl: "https://example.com/image.jpg",
    });

    expect(media.kind).toBe("image");
    expect(media.url).toBe("https://example.com/image.jpg");
  });
});
