import { db } from "../db/firestore";
import { User } from "../types/domain";

const usersCol = db.collection("users");

type RegisterDeviceInput = {
  userId: string;
  areaId: string;
  deviceToken: string;
  name?: string;
};

type UserDoc = {
  name: string;
  areaId: string;
  deviceToken: string;
  createdAt: string;
};

function toPublicUser(id: string, doc: UserDoc): User {
  return {
    id,
    name: doc.name,
    areaId: doc.areaId,
    deviceToken: doc.deviceToken,
    createdAt: doc.createdAt,
  };
}

export async function registerDevice(input: RegisterDeviceInput) {
  const docRef = usersCol.doc(input.userId);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() as UserDoc;
  const updated: UserDoc = {
    name: input.name || data.name,
    areaId: input.areaId,
    deviceToken: input.deviceToken,
    createdAt: data.createdAt,
  };

  await docRef.update({
    name: updated.name,
    areaId: updated.areaId,
    deviceToken: updated.deviceToken,
  });

  return { user: toPublicUser(docRef.id, updated) };
}
