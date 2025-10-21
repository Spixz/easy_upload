import { FileCategory } from "@/commons/enums";
import { findMajoritaryFileCategory } from "@/content_scripts/page_modifiers/input_file/onClick/onInputFileClick";
import { expect, test } from "vitest";

test("in case of equality should return FileCategory.all", () => {
  expect(
    findMajoritaryFileCategory([FileCategory.application, FileCategory.audio]),
  ).toBe(FileCategory.all);
});

test("in the list is empty, should return FileCategory.all", () => {
  expect(findMajoritaryFileCategory([])).toBe(FileCategory.all);
});

test("if one or more FileCategory.all is present, should always return FileCategory.all", () => {
  expect(
    findMajoritaryFileCategory([
      FileCategory.application,
      FileCategory.application,
      FileCategory.audio,
      FileCategory.image,
      FileCategory.all,
    ]),
  ).toBe(FileCategory.all);
});

test("more application", () => {
  expect(
    findMajoritaryFileCategory([
      FileCategory.application,
      FileCategory.application,
      FileCategory.audio,
    ]),
  ).toBe(FileCategory.application);
});

test("more audio", () => {
  expect(
    findMajoritaryFileCategory([
      FileCategory.application,
      FileCategory.audio,
      FileCategory.audio,
    ]),
  ).toBe(FileCategory.audio);
});

test("more video", () => {
  expect(
    findMajoritaryFileCategory([
      FileCategory.application,
      FileCategory.video,
      FileCategory.video,
    ]),
  ).toBe(FileCategory.video);
});

test("more image", () => {
  expect(
    findMajoritaryFileCategory([
      FileCategory.video,
      FileCategory.image,
      FileCategory.image,
    ]),
  ).toBe(FileCategory.image);
});
