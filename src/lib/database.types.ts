export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alumno: {
        Row: {
          activo: boolean
          actualizado_en: string
          apellidos: string | null
          color: string
          creado_en: string
          curso: string | null
          fecha_nacimiento: string | null
          id: string
          nivel: string | null
          nombre: string
          observaciones: string | null
          precio_hora: number | null
          prioridad: number
          user_id: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          apellidos?: string | null
          color?: string
          creado_en?: string
          curso?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nivel?: string | null
          nombre: string
          observaciones?: string | null
          precio_hora?: number | null
          prioridad?: number
          user_id?: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          apellidos?: string | null
          color?: string
          creado_en?: string
          curso?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nivel?: string | null
          nombre?: string
          observaciones?: string | null
          precio_hora?: number | null
          prioridad?: number
          user_id?: string
        }
        Relationships: []
      }
      alumno_materia: {
        Row: {
          alumno_id: string
          creado_en: string
          dificultades: string | null
          horas_recomendadas: number | null
          id: string
          materia_id: string
          nivel: string | null
          prioridad: number
          user_id: string
        }
        Insert: {
          alumno_id: string
          creado_en?: string
          dificultades?: string | null
          horas_recomendadas?: number | null
          id?: string
          materia_id: string
          nivel?: string | null
          prioridad?: number
          user_id?: string
        }
        Update: {
          alumno_id?: string
          creado_en?: string
          dificultades?: string | null
          horas_recomendadas?: number | null
          id?: string
          materia_id?: string
          nivel?: string | null
          prioridad?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumno_materia_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumno_materia_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
        ]
      }
      cambio_clase: {
        Row: {
          clase_id: string
          creado_en: string
          id: string
          motivo: string | null
          tipo: Database["public"]["Enums"]["tipo_cambio_clase"]
          user_id: string
          valor_anterior: Json | null
          valor_nuevo: Json | null
        }
        Insert: {
          clase_id: string
          creado_en?: string
          id?: string
          motivo?: string | null
          tipo: Database["public"]["Enums"]["tipo_cambio_clase"]
          user_id?: string
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Update: {
          clase_id?: string
          creado_en?: string
          id?: string
          motivo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_cambio_clase"]
          user_id?: string
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cambio_clase_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
        ]
      }
      clase: {
        Row: {
          actualizado_en: string
          alumno_id: string
          cobrada: boolean
          creado_en: string
          estado: Database["public"]["Enums"]["estado_clase"]
          fecha: string
          fin_ts: string | null
          hora_fin: string
          hora_inicio: string
          horario_recurrente_id: string | null
          id: string
          inicio_ts: string | null
          materia_id: string | null
          modificada: boolean
          notas_profesor: string | null
          origen: Database["public"]["Enums"]["origen_clase"]
          precio: number | null
          recupera_a_clase_id: string | null
          user_id: string
        }
        Insert: {
          actualizado_en?: string
          alumno_id: string
          cobrada?: boolean
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_clase"]
          fecha: string
          fin_ts?: string | null
          hora_fin: string
          hora_inicio: string
          horario_recurrente_id?: string | null
          id?: string
          inicio_ts?: string | null
          materia_id?: string | null
          modificada?: boolean
          notas_profesor?: string | null
          origen?: Database["public"]["Enums"]["origen_clase"]
          precio?: number | null
          recupera_a_clase_id?: string | null
          user_id?: string
        }
        Update: {
          actualizado_en?: string
          alumno_id?: string
          cobrada?: boolean
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_clase"]
          fecha?: string
          fin_ts?: string | null
          hora_fin?: string
          hora_inicio?: string
          horario_recurrente_id?: string | null
          id?: string
          inicio_ts?: string | null
          materia_id?: string | null
          modificada?: boolean
          notas_profesor?: string | null
          origen?: Database["public"]["Enums"]["origen_clase"]
          precio?: number | null
          recupera_a_clase_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clase_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clase_horario_recurrente_id_fkey"
            columns: ["horario_recurrente_id"]
            isOneToOne: false
            referencedRelation: "horario_recurrente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clase_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clase_recupera_a_clase_id_fkey"
            columns: ["recupera_a_clase_id"]
            isOneToOne: false
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidad: {
        Row: {
          creado_en: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          user_id: string
        }
        Insert: {
          creado_en?: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          user_id?: string
        }
        Update: {
          creado_en?: string
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      disponibilidad_excepcion: {
        Row: {
          creado_en: string
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          tipo: Database["public"]["Enums"]["tipo_excepcion"]
          user_id: string
        }
        Insert: {
          creado_en?: string
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          tipo: Database["public"]["Enums"]["tipo_excepcion"]
          user_id?: string
        }
        Update: {
          creado_en?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_excepcion"]
          user_id?: string
        }
        Relationships: []
      }
      examen: {
        Row: {
          actualizado_en: string
          alumno_id: string
          creado_en: string
          fecha: string
          id: string
          materia_id: string | null
          nivel_preparacion: number
          notas: string | null
          temario: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          actualizado_en?: string
          alumno_id: string
          creado_en?: string
          fecha: string
          id?: string
          materia_id?: string | null
          nivel_preparacion?: number
          notas?: string | null
          temario?: string | null
          titulo: string
          user_id?: string
        }
        Update: {
          actualizado_en?: string
          alumno_id?: string
          creado_en?: string
          fecha?: string
          id?: string
          materia_id?: string | null
          nivel_preparacion?: number
          notas?: string | null
          temario?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "examen_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examen_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
        ]
      }
      horario_recurrente: {
        Row: {
          activo: boolean
          actualizado_en: string
          alumno_id: string
          creado_en: string
          dia_semana: number
          duracion_min: number
          hora_inicio: string
          id: string
          materia_id: string | null
          precio: number | null
          user_id: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          alumno_id: string
          creado_en?: string
          dia_semana: number
          duracion_min?: number
          hora_inicio: string
          id?: string
          materia_id?: string | null
          precio?: number | null
          user_id?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          alumno_id?: string
          creado_en?: string
          dia_semana?: number
          duracion_min?: number
          hora_inicio?: string
          id?: string
          materia_id?: string | null
          precio?: number | null
          user_id?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horario_recurrente_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horario_recurrente_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
        ]
      }
      materia: {
        Row: {
          color: string | null
          creado_en: string
          id: string
          nombre: string
          user_id: string
        }
        Insert: {
          color?: string | null
          creado_en?: string
          id?: string
          nombre: string
          user_id?: string
        }
        Update: {
          color?: string | null
          creado_en?: string
          id?: string
          nombre?: string
          user_id?: string
        }
        Relationships: []
      }
      nota: {
        Row: {
          alumno_id: string | null
          clase_id: string | null
          creado_en: string
          id: string
          texto: string
          user_id: string
        }
        Insert: {
          alumno_id?: string | null
          clase_id?: string | null
          creado_en?: string
          id?: string
          texto: string
          user_id?: string
        }
        Update: {
          alumno_id?: string | null
          clase_id?: string | null
          creado_en?: string
          id?: string
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nota_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil: {
        Row: {
          actualizado_en: string
          creado_en: string
          email: string | null
          id: string
          nombre: string | null
          preferencias: Json
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          email?: string | null
          id: string
          nombre?: string | null
          preferencias?: Json
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          email?: string | null
          id?: string
          nombre?: string | null
          preferencias?: Json
        }
        Relationships: []
      }
      plan_examen: {
        Row: {
          clase_id: string | null
          completado: boolean
          creado_en: string
          descripcion: string
          examen_id: string
          fecha: string
          id: string
          orden: number
          user_id: string
        }
        Insert: {
          clase_id?: string | null
          completado?: boolean
          creado_en?: string
          descripcion: string
          examen_id: string
          fecha: string
          id?: string
          orden?: number
          user_id?: string
        }
        Update: {
          clase_id?: string | null
          completado?: boolean
          creado_en?: string
          descripcion?: string
          examen_id?: string
          fecha?: string
          id?: string
          orden?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_examen_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_examen_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examen"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sesion: {
        Row: {
          actualizado_en: string
          clase_id: string
          contenido: string | null
          creado_en: string
          deberes_casa: string | null
          examen_id: string | null
          id: string
          nivel_progreso: number | null
          notas: string | null
          objetivo: string | null
          tema: string | null
          user_id: string
        }
        Insert: {
          actualizado_en?: string
          clase_id: string
          contenido?: string | null
          creado_en?: string
          deberes_casa?: string | null
          examen_id?: string | null
          id?: string
          nivel_progreso?: number | null
          notas?: string | null
          objetivo?: string | null
          tema?: string | null
          user_id?: string
        }
        Update: {
          actualizado_en?: string
          clase_id?: string
          contenido?: string | null
          creado_en?: string
          deberes_casa?: string | null
          examen_id?: string | null
          id?: string
          nivel_progreso?: number | null
          notas?: string | null
          objetivo?: string | null
          tema?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_sesion_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: true
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sesion_examen_fk"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examen"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscription: {
        Row: {
          auth: string
          creado_en: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          creado_en?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          creado_en?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recordatorio: {
        Row: {
          antelacion_min: number
          creado_en: string
          dispara_en: string
          estado: Database["public"]["Enums"]["estado_recordatorio"]
          id: string
          mensaje: string | null
          ref_id: string
          ref_tipo: string
          tipo: Database["public"]["Enums"]["tipo_recordatorio"]
          user_id: string
        }
        Insert: {
          antelacion_min?: number
          creado_en?: string
          dispara_en: string
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          id?: string
          mensaje?: string | null
          ref_id: string
          ref_tipo: string
          tipo: Database["public"]["Enums"]["tipo_recordatorio"]
          user_id?: string
        }
        Update: {
          antelacion_min?: number
          creado_en?: string
          dispara_en?: string
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          id?: string
          mensaje?: string | null
          ref_id?: string
          ref_tipo?: string
          tipo?: Database["public"]["Enums"]["tipo_recordatorio"]
          user_id?: string
        }
        Relationships: []
      }
      tarea: {
        Row: {
          alumno_id: string
          clase_id: string | null
          completada: boolean
          creado_en: string
          descripcion: string
          fecha_limite: string | null
          id: string
          materia_id: string | null
          tipo: Database["public"]["Enums"]["tipo_tarea"]
          user_id: string
        }
        Insert: {
          alumno_id: string
          clase_id?: string | null
          completada?: boolean
          creado_en?: string
          descripcion: string
          fecha_limite?: string | null
          id?: string
          materia_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_tarea"]
          user_id?: string
        }
        Update: {
          alumno_id?: string
          clase_id?: string | null
          completada?: boolean
          creado_en?: string
          descripcion?: string
          fecha_limite?: string | null
          id?: string
          materia_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_tarea"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarea_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materia"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancelar_clase: {
        Args: {
          p_clase: string
          p_motivo?: string
          p_pendiente_recuperar?: boolean
        }
        Returns: undefined
      }
      generar_mis_clases: {
        Args: { p_horizonte_dias?: number }
        Returns: number
      }
      generar_mis_recordatorios: { Args: never; Returns: number }
      mover_clase: {
        Args: {
          p_clase: string
          p_fecha: string
          p_hora_fin: string
          p_hora_inicio: string
          p_motivo?: string
        }
        Returns: undefined
      }
      reactivar_clase: { Args: { p_clase: string }; Returns: undefined }
      recuperar_clase: {
        Args: {
          p_clase: string
          p_fecha: string
          p_hora_fin: string
          p_hora_inicio: string
        }
        Returns: string
      }
    }
    Enums: {
      estado_clase:
        | "programada"
        | "realizada"
        | "cancelada"
        | "aplazada"
        | "pendiente_recuperar"
      estado_recordatorio: "pendiente" | "enviado" | "visto"
      origen_clase: "recurrente" | "manual" | "recuperacion" | "extraordinaria"
      tipo_cambio_clase:
        | "cancelada"
        | "cambio_fecha"
        | "cambio_hora"
        | "cambio_duracion"
        | "recuperada"
        | "reactivada"
      tipo_excepcion: "bloqueo" | "extra"
      tipo_recordatorio: "clase" | "examen" | "inactividad" | "recuperacion"
      tipo_tarea: "en_clase" | "deberes"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_clase: [
        "programada",
        "realizada",
        "cancelada",
        "aplazada",
        "pendiente_recuperar",
      ],
      estado_recordatorio: ["pendiente", "enviado", "visto"],
      origen_clase: ["recurrente", "manual", "recuperacion", "extraordinaria"],
      tipo_cambio_clase: [
        "cancelada",
        "cambio_fecha",
        "cambio_hora",
        "cambio_duracion",
        "recuperada",
        "reactivada",
      ],
      tipo_excepcion: ["bloqueo", "extra"],
      tipo_recordatorio: ["clase", "examen", "inactividad", "recuperacion"],
      tipo_tarea: ["en_clase", "deberes"],
    },
  },
} as const
