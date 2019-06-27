# read-only-sharelatex

A simple web front-end providing read-only access to download .zip files of projects

## Setting up local data for testing

In order to test the `read-only` service locally, you'll need to have some data in its database (which is not the same as the one used by the main app). Namely, you'll need at least one user and associated projects.

Instructions below will copy your user and projects into the `read_only` database. **This is only relevant for testing in your own local instance**.

Connect to mongo using:

```
docker-compose exec mongo mongo mongodb://localhost/
```

Make sure you have the `read_only` database available. Run:

```
show dbs
```

Look for `read_only`. Output should show something like:

```
admin       0.000GB
local       0.000GB
read_only   0.000GB
sharelatex  0.004GB
```

Connect to the `read_only` database (`use read_only`) and then create the `users` and `projects` collections.

```
db.createCollection('users')
db.createCollection('projects')
```

Switch to the `sharelatex` database:

```
use sharelatex
```

Get your user into a variable (querying by email in this example, but you can also query using your `ObjectId` if you know it):
```
var myUser = db.users.findOne({email:"username@domain.tld"})
```

Inspect your user in order to get its `ObjectId` (just type `myUser` in the mongo shell). Then use it to query for your projects, again storing the results into a variable.

```
var myProjects = db.projects.find({ owner_ref: ObjectId("your-user-object-id") }).toArray()
```

Switch back to the `read_only` database (`use read_only`), then insert your user into the `users` collection:

```
db.users.insertOne(myUser)
```

Then insert your projects into the `projects` collection:

```
db.projects.insertMany(myProjects)
```

You should now be able to log in to the `read-only` service using the same credentials you use with your local Overleaf instance.


