import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Ensure the User schema structure is registered with Mongoose
const UserSchema = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { collection: 'users' })); // Links directly to your 'users' collection in MongoDB

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please fill in all fields.");
        }

        await dbConnect();
        
        // 1. Look for the user inside your MongoDB collection
        const user = await mongoose.models.User.findOne({ 
          email: credentials.email.toLowerCase().trim() 
        });
        
        if (!user) {
          throw new Error("No user found with this email account.");
        }

        // 2. Validate passwords securely using bcrypt
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        // 💡 NOTE: If your signup page doesn't hash passwords yet and saves them as plain text, 
        // comment out the bcrypt line above and use this line instead:
        // const isValid = credentials.password === user.password;

        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        // Return user data to pass down to the session cookie
        return { id: user._id.toString(), email: user.email };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    // 🎯 POINT NEXTAUTH TO YOUR EXISTING LOGIN PAGE:
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
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };