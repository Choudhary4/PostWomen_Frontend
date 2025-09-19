import React, { useState, useEffect } from 'react';
import { Play, Code, BookOpen, Layers, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const GraphQLQueryBuilder = ({ 
  query = '', 
  variables = '{}', 
  onQueryChange, 
  onVariablesChange,
  schema = null,
  onExecuteIntrospection 
}) => {
  const [activeTab, setActiveTab] = useState('query');
  const [showSchema, setShowSchema] = useState(false);
  const [queryType, setQueryType] = useState('query');
  const [parsedSchema, setParsedSchema] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (schema) {
      try {
        const parsed = typeof schema === 'string' ? JSON.parse(schema) : schema;
        setParsedSchema(parsed);
      } catch (e) {
        console.error('Failed to parse schema:', e);
      }
    }
  }, [schema]);

  const handleQueryTypeChange = (type) => {
    setQueryType(type);
    
    // Generate basic template based on type
    let template = '';
    switch (type) {
      case 'query':
        template = `query GetData {
  # Add your query fields here
}`;
        break;
      case 'mutation':
        template = `mutation UpdateData {
  # Add your mutation here
}`;
        break;
      case 'subscription':
        template = `subscription OnDataUpdate {
  # Add your subscription here
}`;
        break;
      default:
        template = query;
    }
    
    if (!query || query.trim() === '') {
      onQueryChange(template);
    }
  };

  const insertTemplate = (template) => {
    const currentQuery = query || '';
    const newQuery = currentQuery + (currentQuery ? '\n\n' : '') + template;
    onQueryChange(newQuery);
  };

  const formatVariables = () => {
    try {
      const parsed = JSON.parse(variables);
      onVariablesChange(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Invalid JSON, leave as is
    }
  };

  const getQueryTemplates = () => {
    return {
      'Basic Query': `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`,
      'Query with Fragments': `fragment UserInfo on User {
  id
  name
  email
}

query GetUsers {
  users {
    ...UserInfo
  }
}`,
      'Nested Query': `query GetPostsWithComments {
  posts {
    id
    title
    content
    author {
      name
      email
    }
    comments {
      id
      content
      author {
        name
      }
    }
  }
}`,
      'Query with Pagination': `query GetPosts($first: Int, $after: String) {
  posts(first: $first, after: $after) {
    edges {
      node {
        id
        title
        content
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`
    };
  };

  const getMutationTemplates = () => {
    return {
      'Create Mutation': `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}`,
      'Update Mutation': `mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    updatedAt
  }
}`,
      'Delete Mutation': `mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    success
    message
  }
}`
    };
  };

  const getSubscriptionTemplates = () => {
    return {
      'Basic Subscription': `subscription OnCommentAdded($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    content
    author {
      name
    }
    createdAt
  }
}`,
      'Real-time Updates': `subscription OnDataUpdate {
  dataUpdated {
    id
    type
    data
    timestamp
  }
}`
    };
  };

  const getCurrentTemplates = () => {
    switch (queryType) {
      case 'mutation':
        return getMutationTemplates();
      case 'subscription':
        return getSubscriptionTemplates();
      default:
        return getQueryTemplates();
    }
  };

  const renderSchemaType = (type) => {
    if (!type) return null;

    return (
      <div className="border rounded p-3 bg-gray-50">
        <h4 className="font-semibold text-gray-800 mb-2">{type.name}</h4>
        <p className="text-sm text-gray-600 mb-2">{type.description}</p>
        
        {type.fields && (
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Fields:</h5>
            <div className="space-y-1">
              {type.fields.map((field, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-mono text-blue-600">{field.name}</span>
                  <span className="text-gray-500">: {field.type.name || field.type.ofType?.name}</span>
                  {field.description && (
                    <div className="text-xs text-gray-500 ml-4">{field.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSchema = () => {
    if (!parsedSchema || !parsedSchema.data) return null;

    const types = parsedSchema.data.__schema?.types || [];
    const queryType = types.find(t => t.name === 'Query');
    const mutationType = types.find(t => t.name === 'Mutation');
    const subscriptionType = types.find(t => t.name === 'Subscription');

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">GraphQL Schema</h3>
          <button
            onClick={onExecuteIntrospection}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
          >
            Refresh Schema
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto">
          {queryType && renderSchemaType(queryType)}
          {mutationType && renderSchemaType(mutationType)}
          {subscriptionType && renderSchemaType(subscriptionType)}
          
          {types
            .filter(t => !['Query', 'Mutation', 'Subscription'].includes(t.name) && 
                       !t.name.startsWith('__'))
            .slice(0, 10)
            .map((type, idx) => (
              <div key={idx}>
                {renderSchemaType(type)}
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* GraphQL Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {['query', 'mutation', 'subscription'].map((type) => (
            <button
              key={type}
              onClick={() => handleQueryTypeChange(type)}
              className={`px-3 py-1 text-sm rounded-md font-medium ${
                queryType === type
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded"
          >
            <BookOpen size={14} />
            Schema
            {showSchema ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Query Editor */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('query')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'query'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Query
              </button>
              <button
                onClick={() => setActiveTab('variables')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'variables'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Variables
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'query' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">GraphQL {queryType}</h3>
                    <div className="flex space-x-2">
                      <select
                        onChange={(e) => insertTemplate(e.target.value)}
                        value=""
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Insert Template...</option>
                        {Object.entries(getCurrentTemplates()).map(([name, template]) => (
                          <option key={name} value={template}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <textarea
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder={`Enter your GraphQL ${queryType} here...`}
                    className="w-full h-80 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {activeTab === 'variables' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">Query Variables (JSON)</h3>
                    <button
                      onClick={formatVariables}
                      className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      Format JSON
                    </button>
                  </div>
                  
                  <textarea
                    value={variables}
                    onChange={(e) => onVariablesChange(e.target.value)}
                    placeholder={`{
  "id": "123",
  "input": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}`}
                    className="w-full h-80 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schema Panel */}
        {showSchema && (
          <div className="lg:col-span-1">
            <div className="border border-gray-200 rounded-lg p-4">
              {renderSchema()}
            </div>
          </div>
        )}
      </div>

      {/* GraphQL Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">GraphQL Tips</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Use Ctrl+Space for auto-completion (when schema is available)</p>
          <p>• Variables allow you to parameterize your queries safely</p>
          <p>• Fragments help you reuse common field selections</p>
          <p>• Introspection query: <code className="bg-blue-100 px-1 rounded">{"{ __schema { types { name } } }"}</code></p>
        </div>
      </div>
    </div>
  );
};

export default GraphQLQueryBuilder;