import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    fetch("http://localhost:3000/api/posts")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
