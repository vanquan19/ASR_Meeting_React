import { UserType } from "./auth";

export interface ChatType {
    id: number;
    sender: UserType;
    receiver: UserType | string;
    type: "file" | "text" | "image" | "video";
    message: string;
    file?: File;
    timestamp: string;
}