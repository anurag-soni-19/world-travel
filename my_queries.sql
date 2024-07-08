create table countries (
	id SERIAL PRIMARY KEY,
	country_code CHAR(2),
	country_name TEXT
);

create table users(
	id serial primary key,
	name text unique not null,
	color text
);

create table vis_countries(
	id SERIAL PRIMARY KEY,
	country_vis CHAR(2) NOT NULL,
	user_id INTEGER REFERENCES users(id),
	unique(country_vis, user_id)
);