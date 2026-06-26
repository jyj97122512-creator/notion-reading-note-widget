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
  relationProperty: string;
  typeProperty: string;
  statusProperty: string;
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
  noteTypeProperty: string;
  noteStatusProperty: string;
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
    noteTypeProperty: config.noteTypeProperty,
    noteStatusProperty: config.noteStatusProperty,
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

export function pageToMemo(page: NotionPage, config: Pick<UserConfig, "noteTypeProperty" | "noteStatusProperty" | "noteRelationProperty">): Memo {
  const relation = readRelation(page.properties[config.noteRelationProperty]) ?? firstRelation(page.properties);
  const typeName = readSelectName(page.properties[config.noteTypeProperty]) ?? "";
  const statusName = readSelectName(page.properties[config.noteStatusProperty]) ?? "";

  return {
    id: page.id,
    text: firstTitle(page.properties) || "Untitled",
    type: normalizeMemoType(typeName),
    status: normalizeMemoStatus(statusName, relation),
    createdAt: page.created_time ?? new Date(0).toISOString(),
    bookId: relation
  };
}

export function buildCreateMemoPayload(input: MemoPayloadInput) {
  const title = input.text.trim().slice(0, 2000);
  const properties: Record<string, any> = {
    Name: { title: [{ text: { content: title } }] },
    [input.typeProperty]: { select: { name: input.type === "passage" ? "Passage" : "Thought" } },
    [input.statusProperty]: { select: { name: input.bookId ? "Linked" : "Unclassified" } }
  };

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
  statusProperty: string;
  bookId: string;
}) {
  return {
    properties: {
      [input.relationProperty]: { relation: [{ id: input.bookId }] },
      [input.statusProperty]: { select: { name: "Linked" } }
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
  return typeName.toLowerCase() === "passage" ? "passage" : "thought";
}

function normalizeMemoStatus(statusName: string, relation: string | null): MemoStatus {
  const normalized = statusName.toLowerCase();
  if (normalized === "error") return "error";
  if (normalized === "linked" || relation) return "linked";
  return "unclassified";
}
