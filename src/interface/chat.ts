import { MemberType } from "./member";

export interface ChatType {
    id: number;
    sender:MemberType;
    receiver: MemberType | string;
    type: "file" | "text" | "image" | "video";
    message: string;
    file?: File;
    timestamp: string;
}