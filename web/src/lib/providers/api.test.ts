import { describe, it, expect } from "vitest";
import { extractBaseUrl } from "./api";

describe("extractBaseUrl", () => {
  it("baseUrl 包含 apiPath 时，正确剥离 apiPath", () => {
    expect(
      extractBaseUrl(
        "https://apihub.agnes-ai.com/v1/chat/completions",
        "/chat/completions",
      ),
    ).toBe("https://apihub.agnes-ai.com/v1");
  });

  it("baseUrl 不包含 apiPath 时，返回原始 baseUrl", () => {
    expect(
      extractBaseUrl("https://api.openai.com/v1", "/chat/completions"),
    ).toBe("https://api.openai.com/v1");
  });

  it("baseUrl 带尾部斜杠时，移除尾部斜杠", () => {
    expect(
      extractBaseUrl("https://api.openai.com/v1/", "/chat/completions"),
    ).toBe("https://api.openai.com/v1");
  });

  it("apiPath 为 undefined 时，仅移除尾部斜杠", () => {
    expect(extractBaseUrl("https://example.com/v1")).toBe(
      "https://example.com/v1",
    );
  });

  it("apiPath 为空字符串时，仅移除尾部斜杠", () => {
    expect(extractBaseUrl("https://example.com/v1", "")).toBe(
      "https://example.com/v1",
    );
  });

  it("baseUrl 无尾部斜杠且 apiPath 以斜杠开头时，正确剥离", () => {
    expect(
      extractBaseUrl(
        "https://apihub.agnes-ai.com/v1/chat/completions",
        "/chat/completions",
      ),
    ).toBe("https://apihub.agnes-ai.com/v1");
  });
});
