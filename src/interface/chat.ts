import { MemberType } from "./member";

export interface ChatType {
    id: number;
    sender:MemberType;
    receiver: MemberType | string;
    type: "file" | "text" | "image" | "video" | "audio";
    message: string;
    file?: File | Blob;
    fileName?: string;
    timestamp: string;
}