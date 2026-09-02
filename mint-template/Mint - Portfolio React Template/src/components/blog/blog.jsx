import React from "react";
// Grille responsive simple en remplacement du swiper (lib abandonnée).
// SCSS
import "./blog.scss";
// Assets
import Preview01 from "../../assets/blog/story01/preview.png";
import Preview02 from "../../assets/blog/story02/preview.png";
import Preview03 from "../../assets/blog/story03/preview.png";
import Preview04 from "../../assets/blog/story04/preview.png";
import Preview05 from "../../assets/blog/story05/preview.png";
import Preview06 from "../../assets/blog/story06/preview.png";
// Components
import Title from "../ui-components/title/title";
import BlogBox from "./blogBox";

const stories = [
  { image: Preview01, id: "1", title: "SUPER BLOG ARTICLE!", description: "Lorem ipsum dolor sit amet, consectetur undo thes tabore et dolore magna aliqua.", date: "21 April 2020" },
  { image: Preview02, id: "2", title: "AWESOME ARTICLE!", description: "Lorem ipsum dolor undo thes tabore et dolore magna aliqua.", date: "27 April 2020" },
  { image: Preview03, id: "3", title: "SUPER TITLE!", description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.", date: "03 May 2020" },
  { image: Preview04, id: "4", title: "BLOG TITLE!", description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.", date: "15 May 2020" },
  { image: Preview05, id: "5", title: "BLOG ARTICLE!", description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.", date: "20 May 2020" },
  { image: Preview06, id: "6", title: "AWESOME TITLE!", description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.", date: "23 May 2020" },
];

const Blog = () => (
  <div className="blog" id="blog">
    <div className="wrapper">
      <Title title="OUR BLOG." />
      <p className="font12">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt<br></br>ut labore et dolore magna aliqua.
      </p>
      <div className="padding30 blog-grid">
        {stories.map((story) => (
          <div key={story.id}>
            <BlogBox article={story} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Blog;
