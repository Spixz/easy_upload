import { FileCategory } from "../enums";

export type RequirementsConstructor = {
  new (...args: any[]): Requirements;
  toRecord(): Record<string, any>;
  fromJSON(json: string | Record<string, any>): Requirements;
};

export abstract class Requirements {
  static fromFileCategory(
    category: FileCategory,
  ): RequirementsConstructor | undefined {
    const outputSchemaMap = new Map<FileCategory, RequirementsConstructor>([
      [FileCategory.image, RequirementsImage],
      [FileCategory.video, RequirementsVideo],
      [FileCategory.audio, RequirementsAudio],
      [FileCategory.all, RequirementsDefault],
    ]);
    return outputSchemaMap.get(category);
  }

  static fromJSON(json: string | Record<string, any>): Requirements {
    throw new Error("toRecord() must be implemented by subclasses");
  }

  static toRecord(): Record<string, any> {
    throw new Error("toRecord() must be implemented by subclasses");
  }

  toString(): string {
    return JSON.stringify(this, null, 2);
  }
}

export class RequirementsImage extends Requirements {
  constructor(
    public accepted_source: string,
    public file_size_limit: string,
    public height_width: string,
    public aspect_ratio: string,
    public other_file_infos: string,
  ) {
    super();
  }

  static fromJSON(json: string | Record<string, any>): RequirementsImage {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return new RequirementsImage(
      obj.accepted_source,
      obj.file_size_limit,
      obj.height_width,
      obj.aspect_ratio,
      obj.other_file_infos,
    );
  }

  static override toRecord(): Record<string, any> {
    return {
      accepted_source: "string",
      file_size_limit: "string",
      height_width: "string",
      aspect_ratio: "string",
      other_file_infos: "string",
    };
  }

  // toString(): string {
  //   return JSON.stringify(this);
  // }
}

export class RequirementsVideo extends Requirements {
  constructor(
    public accepted_source: string,
    public file_size_limit: string,
    public duration_limit: string,
    public resolution_limit: string,
    public aspect_ratio: string,
    public other_file_infos: string,
  ) {
    super();
  }

  static fromJSON(json: string | Record<string, any>): RequirementsVideo {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return new RequirementsVideo(
      obj.accepted_source,
      obj.file_size_limit,
      obj.duration_limit,
      obj.resolution_limit,
      obj.aspect_ratio,
      obj.other_file_infos,
    );
  }

  static override toRecord(): Record<string, any> {
    return {
      accepted_source: "string",
      file_size_limit: "string",
      duration_limit: "string",
      resolution_limit: "string",
      aspect_ratio: "string",
      other_file_infos: "string",
    };
  }

}

export class RequirementsAudio extends Requirements {
  constructor(
    public accepted_source: string,
    public file_size_limit: string,
    public duration_limit: string,
    public other_file_infos: string,
  ) {
    super();
  }

  static fromJSON(json: string | Record<string, any>): RequirementsAudio {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return new RequirementsAudio(
      obj.accepted_source,
      obj.file_size_limit,
      obj.duration_limit,
      obj.other_file_infos,
    );
  }

  static override toRecord(): Record<string, any> {
    return {
      accepted_source: "string",
      file_size_limit: "string",
      duration_limit: "string",
      other_file_infos: "string",
    };
  }
}

export class RequirementsDefault extends Requirements {
  constructor(
    public accepted_source: string,
    public file_size_limit: string,
    public other_file_infos: string,
  ) {
    super();
  }

  static fromJSON(json: string | Record<string, any>): RequirementsDefault {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return new RequirementsDefault(
      obj.accepted_source,
      obj.file_size_limit,
      obj.other_file_infos,
    );
  }

  static override toRecord(): Record<string, any> {
    return {
      accepted_source: "string",
      file_size_limit: "string",
      other_file_infos: "string",
    };
  }
}
