import { Client } from "@notionhq/client";

export type MemoType = "passage" | "thought";
export type MemoStatus = "unclassified" | "linked" | "error";

export interface Book {
  id: string;
  title: string;
  recentCount: number;
}

export interface Memo {
  id: string;
  text: string;
  type: MemoType;
  status: MemoStatus;
  createdAt: string;
  bookId: string | null;
  errorMessage?: string;
}

interface NotionPage {
  id: string;
  created_time?: string;
  properties: Record<string, any>;
}

interface MemoPayloadInput {
  databaseId: string;
  titleProperty: string;
  relationProperty: string;
  typeProperty: string;
  text: string;
  type: MemoType;
  bookId: string | null;
}

export interface UserConfig {
  token: string;
  notesDatabaseId: string;
  recordsDatabaseId: string;
  recordStatusProperty: string;
  currentReadingStatus: string;
  noteTitleProperty: string;
  noteTypeProperty: string;
  noteRelationProperty: string;
}

export function createNotionClient(token: string) {
  if (!token) throw new Error("Missing Notion token");
  return new Client({ auth: token });
}

export function getNotionConfig(config: UserConfig) {
  return {
    notesDatabaseId: config.notesDatabaseId,
    recordsDatabaseId: config.recordsDatabaseId,
    recordStatusProperty: config.recordStatusProperty,
    currentReadingStatus: config.currentReadingStatus,
    noteTitleProperty: config.noteTitleProperty,
    noteTypeProperty: config.noteTypeProperty,
    noteRelationProperty: config.noteRelationProperty
  };
}

export function pageToBook(page: NotionPage): Book {
  return {
    id: page.id,
    title: firstTitle(page.properties) || "Untitled",
    recentCount: 0
  };
}

export function pageToMemo(page: NotionPage, config: Pick<UserConfig, "noteTypeProperty" | "noteRelationProperty">): Memo {
  const relation = readRelation(page.properties[config.noteRelationProperty]) ?? firstRelation(page.properties);
  const typeName = readSelectName(page.properties[config.noteTypeProperty]) ?? "";

  return {
    id: page.id,
    text: firstTitle(page.properties) || "Untitled",
    type: normalizeMemoType(typeName),
    status: relation ? "linked" : "unclassified",
    createdAt: page.created_time ?? new Date(0).toISOString(),
    bookId: relation
  };
}

export function buildCreateMemoPayload(input: MemoPayloadInput) {
  const title = input.text.trim().slice(0, 2000);
  const properties: Record<string, any> = {
    [input.titleProperty]: { title: [{ text: { content: title } }] },
  };

  if (input.typeProperty) {
    properties[input.typeProperty] = { select: { name: input.type === "passage" ? "구절" : "생각" } };
  }

  if (input.bookId) {
    properties[input.relationProperty] = { relation: [{ id: input.bookId }] };
  }

  return {
    parent: { database_id: input.databaseId },
    properties,
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: input.text } }]
        }
      }
    ]
  };
}

export function buildRelationUpdatePayload(input: {
  relationProperty: string;
  bookId: string;
}) {
  return {
    properties: {
      [input.relationProperty]: { relation: [{ id: input.bookId }] },
    }
  };
}


function firstTitle(properties: Record<string, any>): string {
  for (const property of Object.values(properties)) {
    const title = readTitle(property);
    if (title) return title;
  }
  return "";
}

function readTitle(property: any): string {
  if (!property || property.type !== "title" || !Array.isArray(property.title)) {
    return "";
  }
  return property.title.map((part: { plain_text?: string }) => part.plain_text ?? "").join("");
}

function readSelectName(property: any): string | null {
  if (!property || property.type !== "select") {
    return null;
  }
  return property.select?.name ?? null;
}

function readRelation(property: any): string | null {
  if (!property || property.type !== "relation") {
    return null;
  }
  return property.relation?.[0]?.id ?? null;
}

function firstRelation(properties: Record<string, any>): string | null {
  for (const property of Object.values(properties)) {
    const relation = readRelation(property);
    if (relation) return relation;
  }
  return null;
}

function normalizeMemoType(typeName: string): MemoType {
  return typeName === "구절" ? "passage" : "thought";
}
