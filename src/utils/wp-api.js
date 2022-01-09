import axios from "axios";

// export async function discovery({ site_url } = {}) {
//   try {
//     const allPosts = [];
//     let counter = 2;
//     console.log(site_url)
//     // await discoveryy(site_url)
//     const promise = await WPAPI.discover(site_url);
//     const posts = await promise.posts();
//     // console.log(posts);
//     process.exit(1)
//     allPosts.push(posts);

//     if (posts._paging && posts._paging.next) {
//       for (let i = counter; i <= posts._paging.totalPages; i++) {
//         const next_link = generateNextPageLink(site_url, i);
//         const next_page = await axios.get(next_link);
//         allPosts.push(next_page.data);
//       }
//     } else {
//       return allPosts;
//     }

//     return allPosts;
//   } catch (error) {
//     console.log(error);
//   }
// }

export async function discovery({ site_url } = {}) {
  let counter = 1;
  let status = true;
  const res = [];

  try {
    while (status) {
      const next_link = await generateNextPageLink(site_url, counter);
      const content = await axios.get(next_link);
      res.push(content.data);
      counter++;
    }
  } catch (error) {
    return res;
  }
}

export async function getAllPosts(site_url) {
  const pages = [];

  const feed = await discovery({
    site_url,
  });

  for (let page of feed) {
    page.forEach((element) => pages.push(element));
  }

  const res = pages.reduce((a, b) => a.concat(b), []);
  return res;
}

function generateNextPageLink(site_url, counter) {
  return `${site_url}/wp-json/wp/v2/posts?page=${counter}`;
}
