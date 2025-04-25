import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = "S9f&nG3!4Zkp12uXz$eLq8mTfBjKv5Hdema"  
const encodedKey = new TextEncoder().encode(secretKey);


type SessionPayload = {
  email?: string;
  role: string;
  expiresAt?: Date;
};

export async function createSession(email: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ email, role, expiresAt });


  cookies().set("jwt", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
  });
}

export async function deleteSession() {
  
  cookies().delete("jwt");
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify session");
    return null; 
  }
}