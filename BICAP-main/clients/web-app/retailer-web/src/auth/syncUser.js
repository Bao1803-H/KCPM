export async function syncUser() {
  try {
    const res = await fetch("http://localhost:3000/me", {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Not logged in");

    const user = await res.json();
    localStorage.setItem("user", JSON.stringify(user));
    return true;
  } catch {
    localStorage.removeItem("user");
    return false;
  }
}
