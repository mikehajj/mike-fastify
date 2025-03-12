module.exports = {
    "type": "object",
    "title": "Database",
    "description": "Mongo, Mysql, Redis Databases Schemas",
    "default": {},
    "required": [
        "mongo",
        "mysql",
        "redis"
    ],
    "properties": {
        "mongo": {
            "type": "object",
            "title": "Mongo Databases",
            "required": [
                "name",
                "servers"
            ],
            "properties": {
                "name": {
                    "type": "string",
                    "title": "Database Name",
                },
                "prefix": {
                    "type": "string",
                    "title": "Database Optional Name Prefix",
                },
                "servers": {
                    "type": "array",
                    "uniqueItems": true,
                    "minItems": 1,
                    "items": [
                        {
                            "type": "object",
                            "required": ['host', 'port'],
                            "properties": {
                                "host": {"type": "string"},
                                "port": {"type": "number"},
                            }
                        }
                    ]
                },
                "credentials": {
                    "type": "object",
                    "required": ["username", "password"],
                    "properties": {
                        "username": {"type": "string"},
                        "password": {"type": "string"},
                    }
                },
                "URLParam": {
                    "type": "object",
                    "title": "Optional URL Configuration"
                },
                "extraParam": {
                    "type": "object",
                    "title": "Optional Extra Configuration"
                }
            }
        },
        "mysql": {
            "type": "object",
            "title": "MySQL Databases",
            "required": [
                "host",
                "port",
                "database"
            ],
            "properties": {
                "database": {
                    "type": "string",
                    "title": "Database Name",
                },
                "host": {
                    "type": "string",
                    "title": "Database Cluster Host"
                },
                "port": {
                    "type": "number",
                    "title": "Database Cluster Port"
                },
                "user": {
                    "type": "string",
                    "title": "Database user username"
                },
                "password": {
                    "type": "string",
                    "title": "Database user password"
                }
            }
        },
        "redis": {
            "type": "object",
            "title": "Redis Databases",
            "required": [
                "host",
                "port"
            ],
            "properties": {
                "host": {
                    "type": "string",
                    "title": "Database Cluster Host"
                },
                "port": {
                    "type": "number",
                    "title": "Database Cluster Port"
                },
                "user": {
                    "type": "string",
                    "title": "Database user username"
                },
                "password": {
                    "type": "string",
                    "title": "Database user password"
                }
            }
        }
    }
};