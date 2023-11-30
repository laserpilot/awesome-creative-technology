import mustache from "mustache";
import GithubSlugger from "github-slugger";
import fs from "fs";

import { List } from "./types";

const slugger = new GithubSlugger();

export function generateReadme(list: List) {
	// import the readme stub
	const template = fs.readFileSync("./templates/readme.template.md", "utf-8");

	// generate the table of contents
	const contentsList = list
		.map((l) => {
			const { title } = l;
			const slug = slugger.slug(title);

			return `1. [**${title}**](#${slug})`;
		})
		.concat("1. [**Closed Groups**](#closed-groups)")
		.join("\n");

	// generate each list
	const groupsLists = list.map((l) => {
		const { title, description, rows } = l;

		const sortedRows = Object.keys(rows)
			.filter((group) => rows[group].closureReason === undefined) // remove closed groups
			.sort(Intl.Collator().compare) // sort alphabetically, case insensitive
			.map((group) => {
				const { link, locations, keywords, careerLink } = rows[group];

				const linkedName = `[**${group}**](${link})`;

				const locationsString = locations.map((loc) => `[${loc}]`).join(" ");

				let careerLinkString = "";
				if (careerLink === "N/A") {
					careerLinkString = "N/A";
				} else if (careerLink !== undefined && careerLink?.startsWith("https")) {
					// if it's a link to career page
					careerLinkString = `[**career page**](${careerLink})`;
				} else if (careerLink !== undefined && careerLink?.includes("@")) {
					// if it's an email, swap the @ with [at] and . with [dot]
					careerLinkString = careerLink!.replace("@", "[at]").replace(".", "[dot]");
				}

				return [linkedName, locationsString, keywords, careerLinkString];
			});

		let md = "";
		md += `## ${title}\n\n`;
		if (description) md += `${description}\n\n`;
		md += `| Name | Locations | Keywords | Career Page/Email | \n`;
		md += `| ---- | --------- | -------- | --------- |\n`; // make the last column of table shorter?
		md += sortedRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]}`).join("\n");
		md += "\n\n";

		return md;
	});

	// create the markdown
	const md = mustache.render(template, {
		groups: groupsLists.join("\n"),
		toc: contentsList,
	});

	fs.writeFileSync("README.md", md);
}

export function generateClosedReadme(list: List) {
	// import the readme stub
	const template = fs.readFileSync("./templates/closed.template.md", "utf-8");

	// create markdown string
	let groupsLists = "";
	groupsLists += `| Name | Locations | Keywords | Career Page | Closure Reason | up? |\n`;
	groupsLists += `| ---- | --------- | -------- | ----------- | -------------- | --- |\n`;

	list.map((l) => {
		const { rows } = l;

		const sortedRows = Object.keys(rows)
			.filter((group) => rows[group].closureReason !== undefined) // remove non-closed groups
			.sort(Intl.Collator().compare) // sort alphabetically, case insensitive
			.map((group) => {
				const { link, locations, keywords, careerLink, closureReason } = rows[group];

				const linkedName = `[**${group}**](${link})`;

				const locationsString = locations
					.map(
						(loc) =>
							`![${loc}](https://img.shields.io/badge/-${encodeURIComponent(
								loc
							)}-lightgrey?style=flat)`
					)
					.join(" ");

				const upImage = `![](https://img.shields.io/website?down_color=%2300000000&down_message=%E2%9D%8C&label=%20&style=flat-square&up_color=%2300000000&up_message=%F0%9F%8C%90&url=${encodeURIComponent(
					link
				)})`;

				if (careerLink === undefined) {
					return [linkedName, locationsString, keywords, "", closureReason, upImage];
				}

				const careerLinkString = `[**${careerLink}**](${careerLink})`;

				return [linkedName, locationsString, keywords, careerLinkString, closureReason, upImage];
			});

		groupsLists += sortedRows
			.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} |`)
			.join("\n");

		return null;
	});

	// create the markdown
	const md = mustache.render(template, { groups: groupsLists });

	fs.writeFileSync("CLOSED.md", md);
}

export function generateUpReadme(list: List) {
	// import the readme stub
	const template = fs.readFileSync("./templates/up.template.md", "utf-8");

	// create markdown string
	let groupsLists = "";
	groupsLists += `| Name | up? |\n`;
	groupsLists += `| ---- | --- |\n`;

	list.map((l) => {
		const { rows } = l;

		const sortedRows = Object.keys(rows)
			.filter((group) => rows[group].closureReason === undefined) // remove closed groups
			.sort(Intl.Collator().compare) // sort alphabetically, case insensitive
			.map((group) => {
				const { link } = rows[group];

				const linkedName = `[**${group}**](${link})`;

				const upImage = `![](https://img.shields.io/website?down_color=%2300000000&down_message=%E2%9D%8C&label=%20&style=flat-square&up_color=%2300000000&up_message=%F0%9F%8C%90&url=${encodeURIComponent(
					link
				)})`;

				return [linkedName, upImage];
			});

		groupsLists += sortedRows
			.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} |`)
			.join("\n");

		return null;
	});

	// create the markdown
	const md = mustache.render(template, { groups: groupsLists });

	fs.writeFileSync("UP.md", md);
}
