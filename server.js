const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
} = require("graphql");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const app = express();

const departmentSchema = new Schema({
  id: Number,
  name: String,
});

const departmentModel = new mongoose.model("Department", departmentSchema);

const employeeSchema = new Schema({
  id: Number,
  name: String,
  age: Number,
  gender: String,
  salary: Number,
  deptId: Number,
});

const employeeModel = mongoose.model("Employee", employeeSchema);

const EmployeeType = new GraphQLObjectType({
  name: "EmployeeType",
  description: "it defines a employee",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    age: { type: GraphQLNonNull(GraphQLInt) },
    gender: { type: GraphQLNonNull(GraphQLString) },
    salary: { type: GraphQLNonNull(GraphQLInt) },
    deptId: { type: GraphQLNonNull(GraphQLInt) },
    department: {
      type: DepartmentType,
      resolve: async (employee) => {
        const departments = await departmentModel.find({
          id: employee.deptId,
        });
        return departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
        }))[0];
      },
    },
  }),
});

const DepartmentType = new GraphQLObjectType({
  name: "DepartmentType",
  description: "it defines a department",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    employees: {
      type: GraphQLList(EmployeeType),
      resolve: async (department) => {
        const employees = await employeeModel.find({ id: department.id });
        return employees.map((emp) => ({
          id: emp.id,
          name: emp.name,
          age: emp.age,
          gender: emp.gender,
          salary: emp.salary,
        }));
      },
    },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "root query",
  fields: () => ({
    departments: {
      type: GraphQLList(DepartmentType),
      resolve: async () => {
        console.log(await departmentModel.find());
        const departments = await departmentModel.find();
        return departments.map((d) => ({
          id: d.id,
          name: d.name,
        }));
      },
    },
    employees: {
      type: GraphQLList(EmployeeType),
      resolve: async () => {
        const employees = await employeeModel.find();
        return employees.map((emp) => ({
          id: emp.id,
          name: emp.name,
          age: emp.age,
          gender: emp.gender,
          salary: emp.salary,
          deptId: emp.deptId,
        }));
      },
    },
  }),
});

const RootMutaitonType = new GraphQLObjectType({
  name: "Mutation",
  description: "Root Mutation",
  fields: () => ({
    AddDepartment: {
      type: DepartmentType,
      description: "Add a new department",
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const depts = await departmentModel.find();
        const newDept = new departmentModel({
          id: depts.length + 1,
          name: args.name,
        });
        await newDept.save();
        console.log("new dept", newDept);
        return { id: depts.length + 1, name: args.name };
      },
    },
    AddEmployee: {
      type: EmployeeType,
      description: "Add an Employee",
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLNonNull(GraphQLInt) },
        gender: { type: GraphQLNonNull(GraphQLString) },
        salary: { type: GraphQLNonNull(GraphQLInt) },
        deptId: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, args) => {
        const employees = await employeeModel.find();
        const newEmployee = new employeeModel({
          id: employees.length + 1,
          name: args.name,
          age: args.age,
          gender: args.gender,
          salary: args.salary,
          deptId: args.deptId,
        });
        await newEmployee.save();
        return {
          id: employees.length + 1,
          name: args.name,
          age: args.age,
          gender: args.gender,
          salary: args.salary,
          deptId: args.deptId,
        };
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutaitonType,
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

app.listen(8080, () => {
  console.log("server listening on port 80");
});

// If you don't have running local MongoDB instance, replace it with free cloud instance
mongoose.connect(
  "mongodb://localhost:27017/EmployeeDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log("can't connect to MongoDB");
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  }
);
