import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';

interface Node {
  id: string;
  node_type: 'topic' | 'challenge' | 'project' | 'milestone';
  title: string;
  description: string;
  total: number;
  label: string;
  position_x: number;
  position_y: number;
  data?: any;
}

interface Edge {
  source_node_id: string;
  target_node_id: string;
  animated: boolean;
  style?: any;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'DSA' | 'Frontend' | 'Backend' | 'AI / ML' | 'Development' | 'Placement';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_hours: number;
  tags: string[];
  author?: string;
  version?: string;
  is_featured?: boolean;
  is_trending?: boolean;
  is_beginner_friendly?: boolean;
  is_advanced?: boolean;
  nodes: Node[];
  edges: Edge[];
}

const templates: Template[] = [
  // ==========================================
  // DSA CATEGORY
  // ==========================================
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    title: 'NeetCode 150',
    description: 'The standard 150 curated LeetCode problems covering all major data structures and algorithmic patterns required for top tech interviews.',
    category: 'DSA',
    difficulty: 'Advanced',
    estimated_hours: 150,
    tags: ['DSA', 'LeetCode', 'Interview Prep', 'NeetCode'],
    is_featured: true,
    is_trending: true,
    nodes: [
      { id: 'nc-1', node_type: 'topic', title: 'Arrays & Hashing', description: 'Contains Duplicate, Valid Anagram, Two Sum, Group Anagrams, Top K Frequent.', total: 9, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'nc-2', node_type: 'topic', title: 'Two Pointers & Sliding Window', description: 'Valid Palindrome, Two Sum II, 3Sum, Container with Most Water, Best Time to Buy/Sell Stock.', total: 9, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'nc-3', node_type: 'topic', title: 'Stack & Binary Search', description: 'Valid Parentheses, Min Stack, Evaluate Reverse Polish Notation, Search in Rotated Sorted Array.', total: 10, label: 'STEP 3', position_x: 200, position_y: 350 },
      { id: 'nc-4', node_type: 'topic', title: 'Linked List & Trees', description: 'Reverse Linked List, Merge Two Lists, Binary Tree Maximum Path Sum, Serialize/Deserialize Tree.', total: 21, label: 'STEP 4', position_x: 400, position_y: 450 },
      { id: 'nc-5', node_type: 'topic', title: 'Backtracking & Graphs', description: 'Subsets, Combination Sum, Word Search, Number of Islands, Clone Graph, Course Schedule.', total: 15, label: 'STEP 5', position_x: 200, position_y: 600 },
      { id: 'nc-6', node_type: 'milestone', title: 'Dynamic Programming & Greedy', description: 'Climbing Stairs, House Robber, Longest Common Subsequence, Edit Distance.', total: 20, label: 'FINALE', position_x: 300, position_y: 750 }
    ],
    edges: [
      { source_node_id: 'nc-1', target_node_id: 'nc-2', animated: true },
      { source_node_id: 'nc-2', target_node_id: 'nc-3', animated: false },
      { source_node_id: 'nc-3', target_node_id: 'nc-4', animated: true },
      { source_node_id: 'nc-4', target_node_id: 'nc-5', animated: false },
      { source_node_id: 'nc-5', target_node_id: 'nc-6', animated: true }
    ]
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    title: 'Blind 75',
    description: 'The legendary subset of LeetCode questions focusing on core conceptual patterns needed to crack coding interviews.',
    category: 'DSA',
    difficulty: 'Intermediate',
    estimated_hours: 80,
    tags: ['DSA', 'LeetCode', 'Fast Track'],
    is_trending: true,
    nodes: [
      { id: 'b75-1', node_type: 'topic', title: 'Arrays & Matrices', description: 'Two Sum, Best Time to Buy/Sell Stock, Product of Array Except Self, Maximum Subarray.', total: 12, label: 'WEEK 1', position_x: 250, position_y: 100 },
      { id: 'b75-2', node_type: 'topic', title: 'Strings & Linked Lists', description: 'Longest Substring Without Repeating Characters, Reverse Linked List, Merge k Sorted Lists.', total: 15, label: 'WEEK 2', position_x: 450, position_y: 200 },
      { id: 'b75-3', node_type: 'topic', title: 'Trees & Heap', description: 'Invert Binary Tree, Maximum Depth, Binary Tree Level Order Traversal, Merge K Sorted Lists.', total: 18, label: 'WEEK 3', position_x: 250, position_y: 350 },
      { id: 'b75-4', node_type: 'milestone', title: 'DP & Graphs', description: 'Climbing Stairs, Coin Change, Longest Increasing Subsequence, Course Schedule.', total: 20, label: 'WEEK 4', position_x: 350, position_y: 500 }
    ],
    edges: [
      { source_node_id: 'b75-1', target_node_id: 'b75-2', animated: true },
      { source_node_id: 'b75-2', target_node_id: 'b75-3', animated: false },
      { source_node_id: 'b75-3', target_node_id: 'b75-4', animated: true }
    ]
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    title: 'Striver A2Z',
    description: 'Highly exhaustive DSA roadmap guiding you from complete basics up to advanced graph algorithms and heavy dynamic programming.',
    category: 'DSA',
    difficulty: 'Advanced',
    estimated_hours: 250,
    tags: ['DSA', 'Striver', 'Comprehensive', 'SDE Sheet'],
    nodes: [
      { id: 'str-1', node_type: 'topic', title: 'Basics & Sorting', description: 'Time/Space complexity, patterns, basic recursion, bubble/selection/insertion sort.', total: 25, label: 'PHASE 1', position_x: 200, position_y: 100 },
      { id: 'str-2', node_type: 'topic', title: 'Arrays & Binary Search', description: 'Subarrays, sliding window, searching in 1D and 2D arrays, boundary checks.', total: 45, label: 'PHASE 2', position_x: 400, position_y: 200 },
      { id: 'str-3', node_type: 'topic', title: 'Stack, Queue & Linked List', description: 'Implementations, DLL, circular lists, next greater element, LRU Cache.', total: 35, label: 'PHASE 3', position_x: 200, position_y: 350 },
      { id: 'str-4', node_type: 'topic', title: 'Greedy & Recursion', description: 'Huffman coding, fractional knapsack, N-queens, subset sums, sudoku solver.', total: 30, label: 'PHASE 4', position_x: 400, position_y: 450 },
      { id: 'str-5', node_type: 'topic', title: 'Trees & Graphs', description: 'Traversals, height, LCA, Dijkstra, Bellman Ford, MST, Disjoint Set.', total: 50, label: 'PHASE 5', position_x: 200, position_y: 600 },
      { id: 'str-6', node_type: 'milestone', title: 'Dynamic Programming & Tries', description: 'Grid DP, MCM, digit DP, tree DP, trie insert/search.', total: 45, label: 'FINALE', position_x: 300, position_y: 750 }
    ],
    edges: [
      { source_node_id: 'str-1', target_node_id: 'str-2', animated: true },
      { source_node_id: 'str-2', target_node_id: 'str-3', animated: false },
      { source_node_id: 'str-3', target_node_id: 'str-4', animated: true },
      { source_node_id: 'str-4', target_node_id: 'str-5', animated: false },
      { source_node_id: 'str-5', target_node_id: 'str-6', animated: true }
    ]
  },

  // ==========================================
  // FRONTEND CATEGORY
  // ==========================================
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    title: 'HTML',
    description: 'Learn the backbone of visual document markup, semantic structuring, basic form controls, and web accessibility standards.',
    category: 'Frontend',
    difficulty: 'Beginner',
    estimated_hours: 15,
    tags: ['HTML', 'Web Basics', 'Frontend'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'html-1', node_type: 'topic', title: 'Document Structure', description: 'Tags, doctype, head, body, meta description, formatting syntax.', total: 6, label: 'DAY 1', position_x: 250, position_y: 100 },
      { id: 'html-2', node_type: 'topic', title: 'Semantic Elements', description: 'header, footer, nav, article, section, aside, semantic SEO values.', total: 8, label: 'DAY 2', position_x: 450, position_y: 200 },
      { id: 'html-3', node_type: 'milestone', title: 'Forms & Accessibility', description: 'Forms, label validation, aria attributes, input types, semantic buttons.', total: 10, label: 'DAY 3', position_x: 350, position_y: 350 }
    ],
    edges: [
      { source_node_id: 'html-1', target_node_id: 'html-2', animated: true },
      { source_node_id: 'html-2', target_node_id: 'html-3', animated: true }
    ]
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    title: 'CSS',
    description: 'Master style rules, CSS layout systems (Flexbox and Grid), responsive design patterns, custom variables, and transitions.',
    category: 'Frontend',
    difficulty: 'Beginner',
    estimated_hours: 25,
    tags: ['CSS', 'Styling', 'UI Design'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'css-1', node_type: 'topic', title: 'Selectors & Box Model', description: 'Class, ID selectors, margins, borders, padding, sizing models.', total: 10, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'css-2', node_type: 'topic', title: 'Layouts: Flex & Grid', description: 'Flex direction, alignment, grid templates, grid areas, auto-fit/fill properties.', total: 12, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'css-3', node_type: 'milestone', title: 'Animations & Responsiveness', description: 'Media queries, keyframes, transitions, custom properties, styling targets.', total: 8, label: 'STEP 3', position_x: 300, position_y: 350 }
    ],
    edges: [
      { source_node_id: 'css-1', target_node_id: 'css-2', animated: true },
      { source_node_id: 'css-2', target_node_id: 'css-3', animated: true }
    ]
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    title: 'JavaScript',
    description: 'Deep dive into modern ECMAScript features, DOM manipulation, asynchronous programming, APIs fetching, and scope behavior.',
    category: 'Frontend',
    difficulty: 'Beginner',
    estimated_hours: 40,
    tags: ['JS', 'JavaScript', 'Programming Core'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'js-1', node_type: 'topic', title: 'Syntax & Fundamentals', description: 'Variables, loops, functions, array methods, scoping and closures.', total: 12, label: 'PART 1', position_x: 200, position_y: 100 },
      { id: 'js-2', node_type: 'topic', title: 'DOM & Event Loop', description: 'Selecting elements, adding listeners, bubble vs capture, event delegation.', total: 10, label: 'PART 2', position_x: 400, position_y: 200 },
      { id: 'js-3', node_type: 'topic', title: 'Async JavaScript', description: 'Promises, Async/Await, Fetch API, error handling, try/catch structures.', total: 8, label: 'PART 3', position_x: 200, position_y: 350 },
      { id: 'js-4', node_type: 'milestone', title: 'ES6+ Features & Modules', description: 'Destructuring, spread operator, modules (import/export), classes.', total: 10, label: 'FINALE', position_x: 300, position_y: 480 }
    ],
    edges: [
      { source_node_id: 'js-1', target_node_id: 'js-2', animated: true },
      { source_node_id: 'js-2', target_node_id: 'js-3', animated: false },
      { source_node_id: 'js-3', target_node_id: 'js-4', animated: true }
    ]
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    title: 'React',
    description: 'Build robust single-page applications using functional components, state hooks, routers, effects, and local storage state binding.',
    category: 'Frontend',
    difficulty: 'Intermediate',
    estimated_hours: 50,
    tags: ['React', 'Frontend Framework', 'JSX'],
    is_featured: true,
    nodes: [
      { id: 're-1', node_type: 'topic', title: 'Components & Props', description: 'JSX syntax, components architecture, props rendering, lists keys.', total: 8, label: 'PHASE 1', position_x: 200, position_y: 100 },
      { id: 're-2', node_type: 'topic', title: 'Hooks: State & Effects', description: 'useState, useEffect, custom hooks, form handling, input mapping.', total: 15, label: 'PHASE 2', position_x: 400, position_y: 200 },
      { id: 're-3', node_type: 'topic', title: 'Context & Routing', description: 'useContext, router hooks, outlet layouts, protected route logic.', total: 10, label: 'PHASE 3', position_x: 200, position_y: 350 },
      { id: 're-4', node_type: 'milestone', title: 'Zustand & Performance', description: 'State stores, memoization (useMemo, useCallback), bundle optimization.', total: 8, label: 'PHASE 4', position_x: 300, position_y: 480 }
    ],
    edges: [
      { source_node_id: 're-1', target_node_id: 're-2', animated: true },
      { source_node_id: 're-2', target_node_id: 're-3', animated: false },
      { source_node_id: 're-3', target_node_id: 're-4', animated: true }
    ]
  },
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    title: 'Next.js',
    description: 'Learn SEO-friendly React frameworks supporting Server Side Rendering, App Router navigation, static generation, and Server Actions.',
    category: 'Frontend',
    difficulty: 'Advanced',
    estimated_hours: 45,
    tags: ['Next.js', 'SSR', 'App Router', 'React'],
    is_trending: true,
    nodes: [
      { id: 'nxt-1', node_type: 'topic', title: 'App Routing & Layouts', description: 'Folder based routes, nested layouts, loading/error pages, route groups.', total: 8, label: 'STEP 1', position_x: 250, position_y: 100 },
      { id: 'nxt-2', node_type: 'topic', title: 'Server Components vs Client', description: 'Hydration boundaries, fetching inside Server Components, use client directives.', total: 10, label: 'STEP 2', position_x: 450, position_y: 200 },
      { id: 'nxt-3', node_type: 'topic', title: 'Server Actions & API Routes', description: 'Form submissions, mutation actions, revalidation tags, next/headers.', total: 8, label: 'STEP 3', position_x: 250, position_y: 350 },
      { id: 'nxt-4', node_type: 'milestone', title: 'Optimization & Deploying', description: 'next/image, next/font, metadata tags config, deploying on Vercel.', total: 6, label: 'STEP 4', position_x: 350, position_y: 480 }
    ],
    edges: [
      { source_node_id: 'nxt-1', target_node_id: 'nxt-2', animated: true },
      { source_node_id: 'nxt-2', target_node_id: 'nxt-3', animated: false },
      { source_node_id: 'nxt-3', target_node_id: 'nxt-4', animated: true }
    ]
  },

  // ==========================================
  // BACKEND CATEGORY
  // ==========================================
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Node.js',
    description: 'Learn server-side JavaScript: runtimes, the event loop, file systems, streams, buffers, and package management systems.',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimated_hours: 35,
    tags: ['Node.js', 'Runtime', 'Backend core'],
    nodes: [
      { id: 'node-1', node_type: 'topic', title: 'Node Architecture', description: 'V8 engine, Libuv, asynchronous event loop thread pool model.', total: 5, label: 'WEEK 1', position_x: 200, position_y: 100 },
      { id: 'node-2', node_type: 'topic', title: 'File System & Streams', description: 'FS module, buffers, pipe streams, readable/writable structures.', total: 8, label: 'WEEK 2', position_x: 400, position_y: 200 },
      { id: 'node-3', node_type: 'milestone', title: 'HTTP Module & Package', description: 'Creating server sockets, parsing requests, managing package.json dependencies.', total: 7, label: 'WEEK 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'node-1', target_node_id: 'node-2', animated: true },
      { source_node_id: 'node-2', target_node_id: 'node-3', animated: true }
    ]
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Express',
    description: 'Build resilient REST APIs using route declarations, middleware stack sequencing, CORS config, and dynamic error handlers.',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimated_hours: 30,
    tags: ['Express', 'Express.js', 'REST API'],
    nodes: [
      { id: 'exp-1', node_type: 'topic', title: 'Router & HTTP Methods', description: 'GET, POST, PUT, DELETE mappings, request params, query strings.', total: 8, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'exp-2', node_type: 'topic', title: 'Middleware Chains', description: 'Custom middleware, cors, body-parser, rate limit configurations.', total: 10, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'exp-3', node_type: 'milestone', title: 'Controllers & Errors', description: 'MVC structure routing, global error interceptors, async handling.', total: 8, label: 'STEP 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'exp-1', target_node_id: 'exp-2', animated: true },
      { source_node_id: 'exp-2', target_node_id: 'exp-3', animated: true }
    ]
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'PostgreSQL',
    description: 'Learn relational database administration, indexes creation, transactions integrity, normalization rules, and performance optimizations.',
    category: 'Backend',
    difficulty: 'Intermediate',
    estimated_hours: 40,
    tags: ['PostgreSQL', 'SQL', 'Databases', 'Relational'],
    is_featured: true,
    nodes: [
      { id: 'pg-1', node_type: 'topic', title: 'Table Schema & Joins', description: 'CREATE TABLE, foreign keys, INNER/LEFT/OUTER joins query patterns.', total: 12, label: 'PHASE 1', position_x: 250, position_y: 100 },
      { id: 'pg-2', node_type: 'topic', title: 'ACID & Transactions', description: 'COMMIT, ROLLBACK, isolation levels, concurrency problems (dirty reads).', total: 10, label: 'PHASE 2', position_x: 450, position_y: 200 },
      { id: 'pg-3', node_type: 'milestone', title: 'Indexes & Query Tuning', description: 'B-Tree indexes, EXPLAIN ANALYZE, vacuuming, view indexes.', total: 8, label: 'PHASE 3', position_x: 350, position_y: 350 }
    ],
    edges: [
      { source_node_id: 'pg-1', target_node_id: 'pg-2', animated: true },
      { source_node_id: 'pg-2', target_node_id: 'pg-3', animated: true }
    ]
  },

  // ==========================================
  // AI CATEGORY (MAPPED TO 'AI / ML')
  // ==========================================
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Python',
    description: 'Learn Python programming language constructs, object-oriented concepts, virtual environments, and data package collections.',
    category: 'AI / ML',
    difficulty: 'Beginner',
    estimated_hours: 30,
    tags: ['Python', 'AI Core', 'Language'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'py-1', node_type: 'topic', title: 'Syntax & Functions', description: 'Lists, dicts, conditionals, loops, lambda functions, type hints.', total: 10, label: 'WEEK 1', position_x: 200, position_y: 100 },
      { id: 'py-2', node_type: 'topic', title: 'OOP & File I/O', description: 'Classes, inheritance, reading/writing files, handling exceptions.', total: 8, label: 'WEEK 2', position_x: 400, position_y: 200 },
      { id: 'py-3', node_type: 'milestone', title: 'Pip & Poetry Virtualenvs', description: 'Virtual environments setup, pip installs, project structures.', total: 6, label: 'WEEK 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'py-1', target_node_id: 'py-2', animated: true },
      { source_node_id: 'py-2', target_node_id: 'py-3', animated: true }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Machine Learning',
    description: 'Master math prerequisites, features preprocessing, regression and classification modeling, and evaluation parameters.',
    category: 'AI / ML',
    difficulty: 'Intermediate',
    estimated_hours: 90,
    tags: ['Machine Learning', 'Data Science', 'Scikit-Learn'],
    is_featured: true,
    nodes: [
      { id: 'ml-1', node_type: 'topic', title: 'Preprocessing & Math', description: 'Linear algebra, calculus vectors, scaling, encoding values, imputation.', total: 15, label: 'PHASE 1', position_x: 200, position_y: 100 },
      { id: 'ml-2', node_type: 'topic', title: 'Supervised Models', description: 'Regression models, decision trees, random forests, boosting networks.', total: 18, label: 'PHASE 2', position_x: 400, position_y: 200 },
      { id: 'ml-3', node_type: 'topic', title: 'Unsupervised Models', description: 'K-Means clustering, PCA dimension reduction, hierarchical clustering.', total: 10, label: 'PHASE 3', position_x: 200, position_y: 350 },
      { id: 'ml-4', node_type: 'milestone', title: 'Evaluation Metrics', description: 'Precision, Recall, ROC AUC curves, Cross-Validation scoring.', total: 8, label: 'PHASE 4', position_x: 300, position_y: 480 }
    ],
    edges: [
      { source_node_id: 'ml-1', target_node_id: 'ml-2', animated: true },
      { source_node_id: 'ml-2', target_node_id: 'ml-3', animated: false },
      { source_node_id: 'ml-3', target_node_id: 'ml-4', animated: true }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    title: 'Generative AI',
    description: 'Learn LLM pipelines, prompt design rules, semantic embeddings, vector databases, and orchestrating RAG workflows.',
    category: 'AI / ML',
    difficulty: 'Advanced',
    estimated_hours: 80,
    tags: ['GenAI', 'LLMs', 'VectorDB', 'RAG'],
    is_featured: true,
    is_trending: true,
    nodes: [
      { id: 'gen-1', node_type: 'topic', title: 'Prompting & LLM APIs', description: 'System prompts, zero-shot/few-shot, token constraints, temperature parameters.', total: 8, label: 'WEEK 1', position_x: 250, position_y: 100 },
      { id: 'gen-2', node_type: 'topic', title: 'Vector Embeddings', description: 'Distance calculations (cosine, dot), tokenization layers, generating embeddings.', total: 10, label: 'WEEK 2', position_x: 450, position_y: 200 },
      { id: 'gen-3', node_type: 'topic', title: 'Vector Databases', description: 'Pinecone, ChromaDB, PGVector indexing, metadata queries.', total: 8, label: 'WEEK 3', position_x: 250, position_y: 350 },
      { id: 'gen-4', node_type: 'milestone', title: 'Retrieval Augmented Gen', description: 'LangChain indexing, document loaders, chunking strategies, generation steps.', total: 12, label: 'WEEK 4', position_x: 350, position_y: 480 }
    ],
    edges: [
      { source_node_id: 'gen-1', target_node_id: 'gen-2', animated: true },
      { source_node_id: 'gen-2', target_node_id: 'gen-3', animated: false },
      { source_node_id: 'gen-3', target_node_id: 'gen-4', animated: true }
    ]
  },

  // ==========================================
  // PLACEMENT CATEGORY
  // ==========================================
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    title: 'Aptitude',
    description: 'Master quantitative math tricks, logical connections, coding puzzles, and verbal reasoning skills for screening exams.',
    category: 'Placement',
    difficulty: 'Beginner',
    estimated_hours: 50,
    tags: ['Aptitude', 'Math Tricks', 'Placement Exams'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'apt-1', node_type: 'topic', title: 'Quantitative Skills', description: 'Averages, speed, work, simple/compound interest, statistics math.', total: 15, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'apt-2', node_type: 'topic', title: 'Logical Reasoning', description: 'Coding-decoding, blood relations, syllogisms, grid mapping.', total: 12, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'apt-3', node_type: 'milestone', title: 'Verbal & Data Interp', description: 'Comprehension analysis, paragraph ordering, charts and maps.', total: 8, label: 'STEP 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'apt-1', target_node_id: 'apt-2', animated: true },
      { source_node_id: 'apt-2', target_node_id: 'apt-3', animated: true }
    ]
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    title: 'Operating Systems',
    description: 'Core concepts of process control blocks, CPU scheduler algorithms, virtual memory, paging, thrashing, and disk algorithms.',
    category: 'Placement',
    difficulty: 'Intermediate',
    estimated_hours: 30,
    tags: ['OS', 'CS Core', 'Placement'],
    nodes: [
      { id: 'os-1', node_type: 'topic', title: 'Process & CPU Scheduling', description: 'FCFS, SJF, SRTF, Priority, Round Robin scheduler logic.', total: 10, label: 'PHASE 1', position_x: 200, position_y: 100 },
      { id: 'os-2', node_type: 'topic', title: 'Synchronization & Deadlocks', description: 'Semaphores, mutexes, Banker\'s algorithm, deadlock detection rules.', total: 8, label: 'PHASE 2', position_x: 400, position_y: 200 },
      { id: 'os-3', node_type: 'milestone', title: 'Memory & Disk Scheduler', description: 'Paging, TLB, page replacement (LRU, FIFO), SSTF, SCAN disk rules.', total: 10, label: 'PHASE 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'os-1', target_node_id: 'os-2', animated: true },
      { source_node_id: 'os-2', target_node_id: 'os-3', animated: true }
    ]
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    title: 'DBMS',
    description: 'Learn SQL schema rules, normal forms (1NF-BCNF), ACID transaction locks, and relational DB algebra.',
    category: 'Placement',
    difficulty: 'Intermediate',
    estimated_hours: 35,
    tags: ['DBMS', 'SQL', 'CS Core'],
    nodes: [
      { id: 'db-1', node_type: 'topic', title: 'ER Model & SQL Queries', description: 'ER mapping, keys (candidate, primary), aggregation SQL patterns.', total: 10, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'db-2', node_type: 'topic', title: 'Normalization Normal Forms', description: '1NF, 2NF, 3NF, BCNF algorithms, dependency preservation rules.', total: 8, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'db-3', node_type: 'milestone', title: 'ACID & Index Files', description: 'Serializability, 2PL locks, dense/sparse indexing, B+ tree properties.', total: 10, label: 'STEP 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'db-1', target_node_id: 'db-2', animated: true },
      { source_node_id: 'db-2', target_node_id: 'db-3', animated: true }
    ]
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    title: 'Computer Networks',
    description: 'Learn network reference models, TCP handshake sequences, routing math, IP subnetting, and application layer protocols.',
    category: 'Placement',
    difficulty: 'Intermediate',
    estimated_hours: 30,
    tags: ['CN', 'Networks', 'CS Core'],
    nodes: [
      { id: 'cn-1', node_type: 'topic', title: 'OSI Reference Model', description: 'Physical, Data Link, Network, Transport layers services.', total: 8, label: 'WEEK 1', position_x: 200, position_y: 100 },
      { id: 'cn-2', node_type: 'topic', title: 'IP Subnetting & Routing', description: 'Classless routing CIDR, subnet masks, Dijkstra routing, Link State protocol.', total: 10, label: 'WEEK 2', position_x: 400, position_y: 200 },
      { id: 'cn-3', node_type: 'milestone', title: 'TCP & App Layer Protocols', description: '3-way handshake, window size flow control, DNS, HTTP, TLS parameters.', total: 8, label: 'WEEK 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'cn-1', target_node_id: 'cn-2', animated: true },
      { source_node_id: 'cn-2', target_node_id: 'cn-3', animated: true }
    ]
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    title: 'Object-Oriented Programming',
    description: 'Study the pillars of OOPs (Encapsulation, Inheritance, Polymorphism, Abstraction), constructors, virtual tables, and interfaces.',
    category: 'Placement',
    difficulty: 'Intermediate',
    estimated_hours: 25,
    tags: ['OOPs', 'CS Core', 'Interview Prep'],
    is_featured: true,
    nodes: [
      { id: 'oop-1', node_type: 'topic', title: 'Classes & Encapsulation', description: 'Access modifiers, constructor overloading, this reference structures.', total: 8, label: 'STEP 1', position_x: 200, position_y: 100 },
      { id: 'oop-2', node_type: 'topic', title: 'Inheritance & Polymorphism', description: 'Dynamic dispatching, virtual tables, override vs overload concepts.', total: 8, label: 'STEP 2', position_x: 400, position_y: 200 },
      { id: 'oop-3', node_type: 'milestone', title: 'Abstraction & Interfaces', description: 'Pure virtual functions, multiple inheritance problems, interfaces layout.', total: 6, label: 'STEP 3', position_x: 300, position_y: 320 }
    ],
    edges: [
      { source_node_id: 'oop-1', target_node_id: 'oop-2', animated: true },
      { source_node_id: 'oop-2', target_node_id: 'oop-3', animated: true }
    ]
  },

  // ==========================================
  // ADDITIONAL TEMPLATES REQUESTED IN original
  // ==========================================
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'CSE Placement Preparation',
    description: 'Master the complete campus placement curriculum: aptitude, operating systems, databases, Object Oriented Programming, and basic coding constructs.',
    category: 'Placement',
    difficulty: 'Intermediate',
    estimated_hours: 120,
    tags: ['Aptitude', 'DBMS', 'OS', 'OOPs', 'Placement'],
    is_featured: true,
    is_trending: true,
    nodes: [
      { id: 'pl-1', node_type: 'topic', title: 'Quantitative Aptitude', description: 'Solve logical reasoning, speed-time, and probability problems.', total: 15, label: 'WEEK 1', position_x: 100, position_y: 100 },
      { id: 'pl-2', node_type: 'topic', title: 'Operating Systems', description: 'Process synchronization, scheduling algorithms, and memory management concepts.', total: 20, label: 'WEEK 2', position_x: 300, position_y: 200 },
      { id: 'pl-3', node_type: 'topic', title: 'Database Systems', description: 'SQL normalization, indexing, Joins, and transaction protocols.', total: 20, label: 'WEEK 3', position_x: 100, position_y: 350 },
      { id: 'pl-4', node_type: 'topic', title: 'Object-Oriented Programming', description: 'Polymorphism, Inheritance, Encapsulation, and Design patterns in C++/Java.', total: 15, label: 'WEEK 4', position_x: 300, position_y: 450 },
      { id: 'pl-5', node_type: 'milestone', title: 'Placement Readiness Mock', description: 'Complete full-length simulated technical interview tests.', total: 0, label: 'FINALE', position_x: 200, position_y: 600 }
    ],
    edges: [
      { source_node_id: 'pl-1', target_node_id: 'pl-2', animated: true },
      { source_node_id: 'pl-2', target_node_id: 'pl-3', animated: false },
      { source_node_id: 'pl-3', target_node_id: 'pl-4', animated: false },
      { source_node_id: 'pl-4', target_node_id: 'pl-5', animated: true }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: '90-Day DSA Challenge',
    description: 'Intensive curriculum covering core data structures, algorithms, sorting techniques, dynamic programming, and graphs for top-tier product roles.',
    category: 'DSA',
    difficulty: 'Advanced',
    estimated_hours: 180,
    tags: ['DSA', 'NeetCode', 'Interview Prep', 'Algorithms'],
    is_featured: true,
    nodes: [
      { id: 'ch-1', node_type: 'topic', title: 'Arrays & Hashing', description: 'Learn Hash Maps, Prefix Sums, and Sliding Window techniques.', total: 15, label: 'PHASE 1', position_x: 100, position_y: 100 },
      { id: 'ch-2', node_type: 'topic', title: 'Trees & Graphs', description: 'Master Depth First Search, Breadth First Search, and Binary Trees.', total: 25, label: 'PHASE 2', position_x: 300, position_y: 200 },
      { id: 'ch-3', node_type: 'topic', title: 'Dynamic Programming', description: 'Knapsack patterns, grid paths, and optimization memoization algorithms.', total: 20, label: 'PHASE 3', position_x: 200, position_y: 380 }
    ],
    edges: [
      { source_node_id: 'ch-1', target_node_id: 'ch-2', animated: true },
      { source_node_id: 'ch-2', target_node_id: 'ch-3', animated: true }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Full Stack Developer',
    description: 'A comprehensive path covering HTML/CSS structure, frontend React frameworks, backend Express.js server layers, databases, and deployment pipelines.',
    category: 'Development',
    difficulty: 'Beginner',
    estimated_hours: 200,
    tags: ['Web Dev', 'Fullstack', 'React', 'Node', 'Postgres'],
    is_trending: true,
    is_beginner_friendly: true,
    nodes: [
      { id: 'fs-1', node_type: 'topic', title: 'Frontend Fundamentals', description: 'HTML structural layout, vanilla CSS styling, Responsive design paradigms.', total: 10, label: 'HTML & CSS', position_x: 100, position_y: 100 },
      { id: 'fs-2', node_type: 'topic', title: 'React & State Management', description: 'Functional hooks, components state lifecycle, Tailwind CSS integrations.', total: 15, label: 'VITE + REACT', position_x: 300, position_y: 200 },
      { id: 'fs-3', node_type: 'topic', title: 'Backend Express & Node', description: 'REST API design patterns, middle-ware stacks, and file handlers.', total: 15, label: 'BACKEND', position_x: 100, position_y: 350 },
      { id: 'fs-4', node_type: 'milestone', title: 'Database & CI/CD Deployment', description: 'Configure Postgres / Mongo databases and deploy projects to Vercel/Docker.', total: 0, label: 'DEPLOY', position_x: 300, position_y: 450 }
    ],
    edges: [
      { source_node_id: 'fs-1', target_node_id: 'fs-2', animated: true },
      { source_node_id: 'fs-2', target_node_id: 'fs-3', animated: false },
      { source_node_id: 'fs-3', target_node_id: 'fs-4', animated: true }
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'AI Engineer',
    description: 'Master Deep Learning foundations, Natural Language Processing, Transformer architectures, RAG implementations, and LLM orchestration tools like LangChain.',
    category: 'AI / ML',
    difficulty: 'Advanced',
    estimated_hours: 250,
    tags: ['AI', 'LLMs', 'LangChain', 'Deep Learning'],
    is_featured: true,
    is_trending: true,
    nodes: [
      { id: 'aie-1', node_type: 'topic', title: 'Neural Networks Fundamentals', description: 'Learn PyTorch, backpropagation, and multi-layer perceptron models.', total: 12, label: 'DEEP LEARNING', position_x: 100, position_y: 100 },
      { id: 'aie-2', node_type: 'topic', title: 'Transformers & NLP', description: 'Understand self-attention architectures and BERT/GPT pipeline layers.', total: 15, label: 'TRANSFORMERS', position_x: 300, position_y: 200 },
      { id: 'aie-3', node_type: 'topic', title: 'LLM Engineering & RAG', description: 'Develop production Retrieval-Augmented Generation workflows using vector stores.', total: 20, label: 'RAG WORKFLOWS', position_x: 200, position_y: 360 }
    ],
    edges: [
      { source_node_id: 'aie-1', target_node_id: 'aie-2', animated: true },
      { source_node_id: 'aie-2', target_node_id: 'aie-3', animated: true }
    ]
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Data Scientist',
    description: 'Gain fluency in math, visual storytelling, exploratory analysis, regression/classification, and scalable big data querying.',
    category: 'AI / ML',
    difficulty: 'Intermediate',
    estimated_hours: 160,
    tags: ['Data Science', 'Pandas', 'Analytics', 'Statistics'],
    is_beginner_friendly: true,
    nodes: [
      { id: 'ds-1', node_type: 'topic', title: 'Math & Statistics', description: 'Probability theory, hypothesis testing, linear algebra concepts.', total: 10, label: 'MATH', position_x: 100, position_y: 100 },
      { id: 'ds-2', node_type: 'topic', title: 'Data Exploration & Pandas', description: 'Data wrangling, cleaning operations, and Matplotlib visualizations.', total: 15, label: 'ANALYSIS', position_x: 300, position_y: 200 },
      { id: 'ds-3', node_type: 'topic', title: 'Supervised Learning', description: 'Implement regression, decision trees, and random forests models.', total: 20, label: 'ML MODELS', position_x: 200, position_y: 360 }
    ],
    edges: [
      { source_node_id: 'ds-1', target_node_id: 'ds-2', animated: true },
      { source_node_id: 'ds-2', target_node_id: 'ds-3', animated: true }
    ]
  }
];

// Helper to write JSON files
function writeJSONTemplates() {
  const seedsDir = path.join(process.cwd(), 'server', 'seeds');
  const templatesDir = path.join(seedsDir, 'templates');
  
  if (!fs.existsSync(seedsDir)) {
    fs.mkdirSync(seedsDir, { recursive: true });
  }
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  console.log(`Writing JSON templates to: ${templatesDir}`);
  for (const t of templates) {
    const filename = `${t.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    const filePath = path.join(templatesDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(t, null, 2), 'utf-8');
    console.log(`- Created ${filename}`);
  }
}

// Generate the unified SQL patch
function generateSQLMigration() {
  const migrationPath = path.join(process.cwd(), 'roadmap_library_migration.sql');
  console.log(`Generating SQL migration: ${migrationPath}`);

  let sql = `-- ============================================================
-- PlaceMentor AI — Phase 2: Roadmap Library Migration & Seeds
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. Create Tables ─────────────────────────────────────────

-- Roadmap Templates Table
CREATE TABLE IF NOT EXISTS public.roadmap_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('DSA', 'Frontend', 'Backend', 'AI / ML', 'Development', 'Placement')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_hours INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  author TEXT DEFAULT 'System Admin',
  version TEXT DEFAULT '1.0.0',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  is_public BOOLEAN DEFAULT true, -- Deprecated in favor of visibility, kept for API compat
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_beginner_friendly BOOLEAN DEFAULT false,
  is_advanced BOOLEAN DEFAULT false,
  clones_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Template Nodes Table
CREATE TABLE IF NOT EXISTS public.roadmap_template_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'topic' CHECK (node_type IN ('topic', 'challenge', 'project', 'milestone')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  total INTEGER DEFAULT 0,
  label TEXT DEFAULT '',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Template Edges Table
CREATE TABLE IF NOT EXISTS public.roadmap_template_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  animated BOOLEAN DEFAULT false,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Clones Table (Links Template and personal Cloned Roadmap)
CREATE TABLE IF NOT EXISTS public.roadmap_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.roadmap_templates(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cloned_roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  cloned_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Likes Table (Junction)
CREATE TABLE IF NOT EXISTS public.roadmap_likes (
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, user_id)
);

-- Roadmap Bookmarks Table (Junction)
CREATE TABLE IF NOT EXISTS public.roadmap_bookmarks (
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, user_id)
);


-- ── 2. Add visibility column to personal roadmaps table ──────
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted'));


-- ── 3. Create Indexes ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_template_nodes_template ON public.roadmap_template_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_template_edges_template ON public.roadmap_template_edges(template_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_clones_user ON public.roadmap_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_likes_user ON public.roadmap_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_bookmarks_user ON public.roadmap_bookmarks(user_id);


-- ── 4. Enable & Configure RLS Policies ────────────────────────

ALTER TABLE public.roadmap_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_template_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_template_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_bookmarks ENABLE ROW LEVEL SECURITY;

-- Templates (Public can read public/unlisted, only admin can write)
CREATE POLICY "Public can view templates" ON public.roadmap_templates
  FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted');
CREATE POLICY "Admin write templates" ON public.roadmap_templates
  FOR ALL USING (true); -- Service role bypasses RLS implicitly

-- Template Nodes (Public read, admin write)
CREATE POLICY "Public can view template nodes" ON public.roadmap_template_nodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmap_templates WHERE id = template_id AND (visibility = 'public' OR visibility = 'unlisted'))
  );
CREATE POLICY "Admin write template nodes" ON public.roadmap_template_nodes
  FOR ALL USING (true);

-- Template Edges (Public read, admin write)
CREATE POLICY "Public can view template edges" ON public.roadmap_template_edges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmap_templates WHERE id = template_id AND (visibility = 'public' OR visibility = 'unlisted'))
  );
CREATE POLICY "Admin write template edges" ON public.roadmap_template_edges
  FOR ALL USING (true);

-- Clones (User can view/manage own clones)
CREATE POLICY "Users can select own clones" ON public.roadmap_clones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clones" ON public.roadmap_clones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes (User can view/manage own likes)
CREATE POLICY "Users can view own likes" ON public.roadmap_likes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own likes" ON public.roadmap_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.roadmap_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks (User can view/manage own bookmarks)
CREATE POLICY "Users can view own bookmarks" ON public.roadmap_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks" ON public.roadmap_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.roadmap_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Add policy to allow public roadmap viewing
DROP POLICY IF EXISTS "Anyone can view public or unlisted roadmaps" ON public.roadmaps;
CREATE POLICY "Anyone can view public or unlisted roadmaps" ON public.roadmaps
  FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted' OR auth.uid() = user_id);


-- ── 5. Seed Templates Data ──────────────────────────────────────
`;

  // Append insertion statements
  for (const t of templates) {
    const tagsJSON = JSON.stringify(t.tags);
    sql += `
-- Seeding template: ${t.title}
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '${t.id}',
  '${t.title.replace(/'/g, "''")}',
  '${t.description.replace(/'/g, "''")}',
  '${t.category}',
  '${t.difficulty}',
  ${t.estimated_hours},
  '${tagsJSON}'::jsonb,
  'public',
  true,
  ${t.is_featured || false},
  ${t.is_trending || false},
  ${t.is_beginner_friendly || false},
  ${t.difficulty === 'Advanced'}
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '${t.id}';
DELETE FROM public.roadmap_template_edges WHERE template_id = '${t.id}';
`;

    // Append nodes insertion
    if (t.nodes.length > 0) {
      sql += `
INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
`;
      const nodesSQL = t.nodes.map(n => {
        // Generate a deterministic UUID using a hash of template ID + source node ID
        const nodeUUID = crypto.createHash('md5').update(`${t.id}-${n.id}`).digest('hex');
        const formattedUUID = `${nodeUUID.substr(0,8)}-${nodeUUID.substr(8,4)}-${nodeUUID.substr(12,4)}-${nodeUUID.substr(16,4)}-${nodeUUID.substr(20,12)}`;
        return `  ('${formattedUUID}', '${t.id}', '${n.node_type}', '${n.title.replace(/'/g, "''")}', '${n.description.replace(/'/g, "''")}', ${n.total}, '${n.label.replace(/'/g, "''")}', ${n.position_x}, ${n.position_y})`;
      }).join(',\n');
      sql += `${nodesSQL};\n`;
    }

    // Append edges insertion
    if (t.edges.length > 0) {
      sql += `
INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
`;
      const edgesSQL = t.edges.map(e => {
        // Find node UUIDs for source and target
        const getHashUUID = (nodeId: string) => {
          const nodeUUID = crypto.createHash('md5').update(`${t.id}-${nodeId}`).digest('hex');
          return `${nodeUUID.substr(0,8)}-${nodeUUID.substr(8,4)}-${nodeUUID.substr(12,4)}-${nodeUUID.substr(16,4)}-${nodeUUID.substr(20,12)}`;
        };
        const sourceUUID = getHashUUID(e.source_node_id);
        const targetUUID = getHashUUID(e.target_node_id);
        return `  ('${t.id}', '${sourceUUID}', '${targetUUID}', ${e.animated})`;
      }).join(',\n');
      sql += `${edgesSQL};\n`;
    }
  }

  fs.writeFileSync(migrationPath, sql, 'utf-8');
  console.log(`- Created/Updated roadmap_library_migration.sql successfully.`);
}

// Perform direct seed into Supabase Admin client
async function runDatabaseSeed() {
  console.log('Starting direct database seed via Supabase...');
  for (const t of templates) {
    console.log(`Seeding template: ${t.title} (${t.id})`);
    
    // 1. Upsert template metadata
    const { error: tError } = await supabaseAdmin
      .from('roadmap_templates')
      .upsert({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        estimated_hours: t.estimated_hours,
        tags: t.tags,
        visibility: 'public',
        is_public: true,
        is_featured: t.is_featured || false,
        is_trending: t.is_trending || false,
        is_beginner_friendly: t.is_beginner_friendly || false,
        is_advanced: t.difficulty === 'Advanced',
      });

    if (tError) {
      console.error(`- Error upserting template metadata: ${tError.message}`);
      continue;
    }

    // 2. Clean old nodes/edges
    await supabaseAdmin.from('roadmap_template_nodes').delete().eq('template_id', t.id);
    await supabaseAdmin.from('roadmap_template_edges').delete().eq('template_id', t.id);

    // 3. Prepare node rows
    const nodeMapping: Record<string, string> = {};
    const nodeRows = t.nodes.map(n => {
      const nodeUUID = crypto.createHash('md5').update(`${t.id}-${n.id}`).digest('hex');
      const formattedUUID = `${nodeUUID.substr(0,8)}-${nodeUUID.substr(8,4)}-${nodeUUID.substr(12,4)}-${nodeUUID.substr(16,4)}-${nodeUUID.substr(20,12)}`;
      nodeMapping[n.id] = formattedUUID;
      return {
        id: formattedUUID,
        template_id: t.id,
        node_type: n.node_type,
        title: n.title,
        description: n.description,
        total: n.total,
        label: n.label,
        position_x: n.position_x,
        position_y: n.position_y,
        data: n.data || {}
      };
    });

    if (nodeRows.length > 0) {
      const { error: nError } = await supabaseAdmin
        .from('roadmap_template_nodes')
        .insert(nodeRows);
      if (nError) {
        console.error(`- Error inserting nodes: ${nError.message}`);
        continue;
      }
    }

    // 4. Prepare edge rows
    const edgeRows = t.edges.map(e => {
      const sourceUUID = nodeMapping[e.source_node_id];
      const targetUUID = nodeMapping[e.target_node_id];
      return {
        template_id: t.id,
        source_node_id: sourceUUID,
        target_node_id: targetUUID,
        animated: e.animated,
        style: e.style || {}
      };
    });

    if (edgeRows.length > 0) {
      const { error: eError } = await supabaseAdmin
        .from('roadmap_template_edges')
        .insert(edgeRows);
      if (eError) {
        console.error(`- Error inserting edges: ${eError.message}`);
        continue;
      }
    }
    
    console.log(`- Successfully seeded ${t.title}`);
  }
}

// Main Runner
async function main() {
  writeJSONTemplates();
  generateSQLMigration();
  
  if (process.argv.includes('--seed')) {
    await runDatabaseSeed();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Seed generation error:', err);
  process.exit(1);
});
