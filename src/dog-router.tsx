import { Context, Hono } from 'hono';
// import {KV} from 'cloudflare';
import type { FC } from 'hono/jsx';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const router = new Hono();

interface NewDog {
	name: string;
	breed: string;
}

interface Dog extends NewDog {
	id: number;
}

let lastId = 0;

// The dogs are maintained in memory.
const dogMap: { [id: number]: Dog } = {};

function addDog(name: string, breed: string): Dog {
	const id = ++lastId;
	const dog = { id, name, breed };
	dogMap[id] = dog;
	return dog;
}

addDog('Comet', 'Whippet');
addDog('Oscar', 'German Shorthaired Pointer');

// This provides HTML boilerplate for any page.
const Layout: FC = props => {
	return (
		<html>
			<head>
				<link rel="stylesheet" href="/styles.css" />
				<title>{props.title}</title>
			</head>
			<body>{props.children}</body>
		</html>
	);
};

// This returns JSX for a page that
// list the dogs passed in a prop.
const DogPage: FC = async ({ dogs }) => {
	// await KV.put('number', 19);
	// const number = await KV.get('number');
	// console.log('dog-router.tsx DogPage: number =', number);

	const title = 'Dogs I Know';
	return (
		<Layout title={title}>
			<h1>{title}</h1>
			<ul>
				{dogs.map((dog: Dog) => (
					<li>
						{dog.name} is a {dog.breed}.
					</li>
				))}
			</ul>
		</Layout>
	);
};

// This gets all the dogs as either JSON or HTML.
const getAllRoute = router.get('/', (c: Context) => {
	const accept = c.req.header('Accept');
	if (accept && accept.includes('application/json')) {
		return c.json(dogMap);
	}

	const dogs = Object.values(dogMap).sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	return c.html(<DogPage dogs={dogs} />);
});

// This gets one dog by its id as JSON.
const idSchema = z.object({
	id: z.coerce.number().positive()
});
const idValidator = zValidator('param', idSchema);
const getOneRoute = router.get('/:id', idValidator, (c: Context) => {
	const id = Number(c.req.param('id'));
	const dog = dogMap[id];
	c.status(dog ? 200 : 404);
	return c.json(dog);
});

// This creates a new dog.
const dogSchema = z
	.object({
		id: z.number().positive().optional(),
		name: z.string().min(1),
		breed: z.string().min(2)
	})
	.strict(); // no extra properties allowed
const dogValidator = zValidator('json', dogSchema);
const createRoute = router.post('/', dogValidator, async (c: Context) => {
	const data = (await c.req.json()) as unknown as NewDog;
	const dog = addDog(data.name, data.breed);
	c.status(201);
	return c.json(dog);
});

// This updates the dog with a given id.
const updateRoute = router.put(
	'/:id',
	idValidator,
	dogValidator,
	async (c: Context) => {
		const id = Number(c.req.param('id'));
		const data = (await c.req.json()) as unknown as NewDog;
		const dog = dogMap[id];
		if (dog) {
			dog.name = data.name;
			dog.breed = data.breed;
		}
		c.status(dog ? 200 : 404);
		return c.json(dog);
	}
);

// This deletes the dog with a given id.
const deleteRoute = router.delete('/:id', idValidator, async (c: Context) => {
	const id = Number(c.req.param('id'));
	const dog = dogMap[id];
	if (dog) delete dogMap[id];
	c.status(dog ? 200 : 404);
	return c.text('');
});

export default router;
export type CreateType = typeof createRoute;
export type DeleteType = typeof deleteRoute;
export type GetAllType = typeof getAllRoute;
export type GetOneType = typeof getOneRoute;
export type UpdateType = typeof updateRoute;
