# role-assignment-service/src/server/handlers

API Resource handlers are declared in [/src/interface/api.yaml](../../interface/api.yaml)
and implemented in separate files or modules in this folder.

Here should be only the code related to `HTTP @hapi` server scope.
Most files will depend on the specific to _role-assignment-service_ data model which is implemented in [/src/model](../../model/README.md) module. Please keep the idea of `separation of concern` fresh and live.
