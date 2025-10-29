// PostgreSQL HTTP API 客户端
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface QueryResult {
  data: any[] | null;
  count?: number;
  error: string | null;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<QueryResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API request error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 执行查询
export async function query(sql: string, params?: any[]): Promise<any> {
  const result = await apiRequest('/query', {
    method: 'POST',
    body: JSON.stringify({ sql, params })
  });
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return {
    rows: result.data,
    rowCount: result.count
  };
}

interface WhereCondition {
  column: string;
  operator: string;
  value: any;
}

class PostgresQueryBuilder {
  private table: string;
  private selectFields: string = '*';
  private whereConditions: WhereCondition[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';

  constructor(tableName: string) {
    this.table = tableName;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, operator: 'neq', value });
    return this;
  }

  like(column: string, value: any) {
    this.whereConditions.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column: string, value: any) {
    this.whereConditions.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.whereConditions.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByClause = `${column} ${direction.toUpperCase()}`;
    return this;
  }

  limit(count: number) {
    this.limitClause = count.toString();
    return this;
  }

  async execute() {
    try {
      // 构建查询参数
      const queryParams: any = {};
      
      if (this.selectFields !== '*') {
        queryParams.select = this.selectFields;
      }
      
      // WHERE 条件 - 简化处理，只支持 eq 操作
      if (this.whereConditions.length > 0) {
        const whereObj: any = {};
        for (const condition of this.whereConditions) {
          if (condition.operator === 'eq') {
            whereObj[condition.column] = condition.value;
          }
        }
        if (Object.keys(whereObj).length > 0) {
          queryParams.where = JSON.stringify(whereObj);
        }
      }
      
      // ORDER BY
      if (this.orderByClause) {
        queryParams.order = this.orderByClause;
      }
      
      // LIMIT
      if (this.limitClause) {
        queryParams.limit = this.limitClause;
      }
      
      const queryString = new URLSearchParams(queryParams).toString();
      const endpoint = `/table/${this.table}${queryString ? '?' + queryString : ''}`;
      
      const result = await apiRequest(endpoint);
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 插入数据
  async insert(data: any) {
    try {
      const result = await apiRequest(`/table/${this.table}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('PostgreSQL insert error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 更新数据
  async update(data: any) {
    try {
      const whereObj: any = {};
      for (const condition of this.whereConditions) {
        if (condition.operator === 'eq') {
          whereObj[condition.column] = condition.value;
        }
      }

      const result = await apiRequest(`/table/${this.table}`, {
        method: 'PATCH',
        body: JSON.stringify({ data, where: whereObj })
      });
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('PostgreSQL update error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 删除数据
  async delete() {
    try {
      const whereObj: any = {};
      for (const condition of this.whereConditions) {
        if (condition.operator === 'eq') {
          whereObj[condition.column] = condition.value;
        }
      }

      const result = await apiRequest(`/table/${this.table}`, {
        method: 'DELETE',
        body: JSON.stringify({ where: whereObj })
      });
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('PostgreSQL delete error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// PostgreSQL 适配器类，模拟 Supabase 接口
export class PostgresAdapter {
  from(tableName: string) {
    return new PostgresQueryBuilder(tableName);
  }
}

// 检查是否应该使用 PostgreSQL
export function shouldUsePostgres(): boolean {
  return import.meta.env.VITE_USE_POSTGRES === 'true';
}

// 创建 PostgreSQL 适配器实例
export const postgres = new PostgresAdapter();