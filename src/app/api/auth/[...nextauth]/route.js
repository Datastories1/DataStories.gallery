import NextAuthImport from "next-auth";
import CredentialsImport from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Handle CJS/ESM interop fallbacks for App Router
const NextAuth = NextAuthImport.default || NextAuthImport;
const CredentialsProvider = CredentialsImport.default || CredentialsImport;

// Ensure the User schema structure is registered with Mongoose safely
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { collection: "users" }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please fill in all fields.");
        }

        await dbConnect();

        // Look for the user inside your MongoDB collection
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("No user found with this email account.");
        }

        // Validate passwords securely using bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        // Return user data to pass down to the session cookie
        return { id: user._id.toString(), email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id;
      return session;
    },
  },
  secret: process.process?.env?.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };