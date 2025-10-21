import { FileCategory } from "@/commons/enums";
import { inferCategoryFromMimeString } from "@/content_scripts/page_modifiers/input_file/onClick/onInputFileClick";
import { expect, test } from "vitest";

test("*", () => {
  expect(inferCategoryFromMimeString("*")).toBe(FileCategory.all);
});

test(".pdf", () => {
  expect(inferCategoryFromMimeString(".pdf")).toBe(FileCategory.application);
});

test(".avi", () => {
  expect(inferCategoryFromMimeString(".avi")).toBe(FileCategory.video);
});

test(".mov", () => {
  expect(inferCategoryFromMimeString(".mov")).toBe(FileCategory.video);
});

test(".mp4 (normally lookup return application/mp4)", () => {
  expect(inferCategoryFromMimeString(".mp4")).toBe(FileCategory.video);
});

test("application/mp4", () => {
  expect(inferCategoryFromMimeString(".mp4")).toBe(FileCategory.video);
});

test("video/mp4", () => {
  expect(inferCategoryFromMimeString("video/mp4")).toBe(FileCategory.video);
});

test("mkv", () => {
  expect(inferCategoryFromMimeString(".mkv")).toBe(FileCategory.video);
});

test("application/x-matroska (normally it's not found)", () => {
  expect(inferCategoryFromMimeString("application/x-matroska")).toBe(
    FileCategory.video,
  );
});

test(".ogx (normally return application/ogg)", () => {
  expect(inferCategoryFromMimeString(".mp4")).toBe(FileCategory.video);
});

test("image/png", () => {
  expect(inferCategoryFromMimeString("image/png")).toBe(FileCategory.image);
});

test(".png", () => {
  expect(inferCategoryFromMimeString(".png")).toBe(FileCategory.image);
});
