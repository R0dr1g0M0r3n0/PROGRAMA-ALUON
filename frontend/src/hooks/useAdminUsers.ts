import { useEffect, useState } from 'react';
import { staffAuthHeaders } from '../services/staffAuthApi';

export type Role =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'DIOS'
  | 'CONTABILIDAD'
  | 'RRHH'
  | 'ALMACEN'
  | 'SOLDADOR'
  | 'CONDUCTOR'
  | 'MONTADOR';

export type ContractType =
  | 'INDEFINIDO'
  | 'TEMPORAL'
  | 'PRACTICAS'
  | 'AUTONOMO'
  | 'PARCIAL'
  | 'COMPLETO';

export interface AdminUser {
  id?: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: number;
  role: Role;
  horario?: string;
  tipoContrato: ContractType;
  fotoBase64?: string | null;
}

export interface AdminUserForm extends AdminUser {
  fotoFile?: File | null;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    const response = await fetch('/api/admin/roles', { headers: staffAuthHeaders() });
    const data = await response.json();
    setRoles(Array.isArray(data) ? (data as Role[]) : []);
  };

  const fetchContractTypes = async () => {
    const response = await fetch('/api/admin/contract-types', { headers: staffAuthHeaders() });
    const data = await response.json();
    setContractTypes(Array.isArray(data) ? (data as ContractType[]) : []);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { headers: staffAuthHeaders() });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (user: AdminUserForm) => {
    const isEdit = Boolean(user.id);
    const url = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    const payload: Partial<AdminUser> = {
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      telefono: user.telefono,
      role: user.role,
      horario: user.horario,
      tipoContrato: user.tipoContrato,
      fotoBase64: user.fotoBase64 ?? null,
    };

    const response = await fetch(url, {
      method,
      headers: staffAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      fetchUsers();
    }
  };

  const deleteUser = async (id: number) => {
    const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: staffAuthHeaders() });
    if (response.ok) {
      fetchUsers();
    }
  };

  useEffect(() => {
    Promise.all([fetchRoles(), fetchContractTypes(), fetchUsers()]);
  }, []);

  return { users, roles, contractTypes, loading, saveUser, deleteUser };
};
