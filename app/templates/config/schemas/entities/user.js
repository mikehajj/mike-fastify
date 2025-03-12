module.exports = {
    "type": "object",
    "title": "User Record",
    "description": "Contains the Account and Profile Information",
    "required": [
        "username",
        "config",
        "email",
        "firstName",
        "groups",
        "lastName",
        "profile",
        "status",
        "ts",
        "account"
    ],
    "properties": {
        "username": {
            "type": "string",
            "title": "username"
        },
        "config": {
            "type": "object",
            "title": "user config object",
            "description": "Contains custom user configuration that can either be global or per microservice"
        },
        "email": {
            "type": "string",
            "title": "email",
            "description": "Unique account email"
        },
        "firstName": {
            "type": "string",
            "title": "First Name"
        },
        "lastName": {
            "type": "string",
            "title": "Last Name"
        },
        "groups": {
            "type": "object",
            "title": "User Groups",
            "description": "The groups the user belongs to.",
            "additionalProperties": {
                "type": "object",
                "title": "One Group",
                "required": [
                    "_id",
                    "code",
                    "name",
                    "description"
                ],
                "properties": {
                    "_id": {
                        "type": "string",
                        "title": "Group Id"
                    },
                    "code": {
                        "type": "string",
                        "title": "Group Code"
                    },
                    "name": {
                        "type": "string",
                        "title": "Group Name"
                    },
                    "description": {
                        "type": "string",
                        "title": "Group Description"
                    }
                }
            }
        },
        "profile": {
            "type": "object",
            "title": "User Profile",
            "description": "Optional Free JSON Schema Object that holds custom information regarding the user profile."
        },
        "account": {
            "type": "object",
            "title": "Organization Account",
            "description": "The Organization account that the user belongs to",
            "required": [
                "_id",
                "name"
            ],
            "properties": {
                "_id": {
                    "type": "string",
                    "title": "Account Id"
                },
                "name": {
                    "type": "string",
                    "title": "Account Name"
                }
            }
        }
    }
}